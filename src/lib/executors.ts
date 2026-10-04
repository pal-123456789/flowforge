import type { FlowNode, LogEntry } from "./types";
import {
  resolveTemplate,
  resolveToString,
  asContext,
  compare,
  getPath,
} from "./expression";

/** Context passed to every executor. */
export interface ExecContext {
  input: unknown;
  node: FlowNode;
  log: (level: LogEntry["level"], message: string) => void;
  signal?: AbortSignal;
}

export interface ExecResult {
  output: unknown;
  /** which output handle to follow; defaults to "out" */
  branch?: string;
  /** if false, downstream nodes are skipped (filter failed) */
  pass?: boolean;
  /** for loop nodes: emit multiple items */
  items?: unknown[];
}

type Executor = (ctx: ExecContext) => Promise<ExecResult> | ExecResult;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------- utilities ------------------------------- */

function cfg(node: FlowNode): Record<string, unknown> {
  return node.data.config || {};
}

function parseMaybeJson(v: unknown): unknown {
  if (typeof v !== "string") return v;
  const t = v.trim();
  if (!t) return undefined;
  if (
    (t.startsWith("{") && t.endsWith("}")) ||
    (t.startsWith("[") && t.endsWith("]"))
  ) {
    try {
      return JSON.parse(t);
    } catch {
      return v;
    }
  }
  return v;
}

/* ------------------------------- executors ------------------------------- */

const executors: Record<string, Executor> = {
  /* triggers simply emit their payload */
  "trigger.manual": ({ node }) => {
    const payload = parseMaybeJson(cfg(node).payload) ?? {};
    return { output: payload };
  },
  "trigger.webhook": ({ node, input }) => {
    // in a real webhook call `input` is the request body; otherwise sample
    const sample = parseMaybeJson(cfg(node).sample) ?? {};
    return { output: input ?? sample };
  },
  "trigger.schedule": ({ node }) => {
    return {
      output: { triggeredAt: new Date().toISOString(), cron: cfg(node).cron },
    };
  },
  "trigger.interval": ({ node }) => {
    return {
      output: {
        triggeredAt: new Date().toISOString(),
        intervalSeconds: cfg(node).seconds,
      },
    };
  },

  /* actions */
  "action.http": async ({ node, input, log, signal }) => {
    const c = cfg(node);
    const ctx = asContext(input);
    const url = resolveToString(String(c.url || ""), ctx);
    const method = String(c.method || "GET");
    const headers: Record<string, string> = {};
    const rawHeaders = (c.headers || {}) as Record<string, string>;
    for (const [k, v] of Object.entries(rawHeaders)) {
      if (k) headers[k] = resolveToString(String(v), ctx);
    }
    if (!url) throw new Error("HTTP Request: URL is empty");

    const init: RequestInit = { method, headers, signal };
    if (method !== "GET" && method !== "HEAD") {
      const bodyStr = resolveToString(String(c.body || ""), ctx);
      if (bodyStr) {
        init.body = bodyStr;
        if (!headers["Content-Type"] && !headers["content-type"]) {
          headers["Content-Type"] = "application/json";
        }
      }
    }
    log("info", `${method} ${url}`);
    const res = await fetch(url, init);
    const text = await res.text();
    let data: unknown = text;
    try {
      data = JSON.parse(text);
    } catch {
      /* keep as text */
    }
    log(res.ok ? "info" : "warn", `Response ${res.status} (${text.length} bytes)`);
    return {
      output: { status: res.status, ok: res.ok, data, url },
    };
  },

  "action.email": ({ node, input, log }) => {
    const c = cfg(node);
    const ctx = asContext(input);
    const to = resolveToString(String(c.to || ""), ctx);
    const subject = resolveToString(String(c.subject || ""), ctx);
    const body = resolveToString(String(c.body || ""), ctx);
    log("info", `✉️  Email -> ${to || "(no recipient)"} · "${subject}"`);
    log("debug", body);
    return {
      output: {
        ...ctx,
        email: { to, subject, body, sentAt: new Date().toISOString(), mock: true },
      },
    };
  },

  "action.log": ({ node, input, log }) => {
    const c = cfg(node);
    const ctx = asContext(input);
    const msg = resolveToString(String(c.message || ""), ctx);
    const level = (c.level as LogEntry["level"]) || "info";
    log(level, msg);
    return { output: input };
  },

  "action.delay": async ({ node, input, log }) => {
    const ms = Math.max(0, Math.min(10000, Number(cfg(node).ms) || 0));
    log("info", `Waiting ${ms}ms…`);
    await sleep(ms);
    return { output: input };
  },

  "action.writeFile": async ({ node, input, log }) => {
    const c = cfg(node);
    const ctx = asContext(input);
    const filename = resolveToString(String(c.filename || "output.json"), ctx);
    const content = resolveToString(String(c.content || "{{json}}"), ctx);
    // Server-side write when running in the API; in browser preview we just log.
    if (typeof window === "undefined") {
      try {
        const { writeOutputFile } = await import("./server/outputs");
        const path = await writeOutputFile(filename, content);
        log("info", `Wrote ${content.length} bytes to ${path}`);
        return { output: { ...ctx, writtenTo: path, bytes: content.length } };
      } catch (e) {
        log("warn", `File write skipped: ${(e as Error).message}`);
      }
    } else {
      log("info", `(preview) Would write ${content.length} bytes to ${filename}`);
    }
    return { output: { ...ctx, filename, bytes: content.length } };
  },

  /* logic */
  "logic.if": ({ node, input }) => {
    const c = cfg(node);
    const ctx = asContext(input);
    const left = resolveTemplate(String(c.left || ""), ctx);
    const right = resolveTemplate(String(c.right ?? ""), ctx);
    const result = compare(left, String(c.operator || "truthy"), right);
    return { output: input, branch: result ? "true" : "false" };
  },

  "logic.switch": ({ node, input }) => {
    const c = cfg(node);
    const ctx = asContext(input);
    const value = String(resolveTemplate(String(c.value || ""), ctx));
    let branch = "default";
    if (value === String(c.case1)) branch = "case1";
    else if (value === String(c.case2)) branch = "case2";
    else if (value === String(c.case3)) branch = "case3";
    return { output: input, branch };
  },

  "logic.filter": ({ node, input, log }) => {
    const c = cfg(node);
    const ctx = asContext(input);
    const left = resolveTemplate(String(c.left || ""), ctx);
    const right = resolveTemplate(String(c.right ?? ""), ctx);
    const pass = compare(left, String(c.operator || "truthy"), right);
    log(pass ? "info" : "warn", pass ? "Filter passed" : "Filter blocked — downstream skipped");
    return { output: input, pass };
  },

  "logic.merge": ({ node, input }) => {
    // merge receives an array of upstream outputs (engine collects them)
    const strategy = String(cfg(node).strategy || "combine");
    const arr = Array.isArray(input) ? input : [input];
    if (strategy === "array") return { output: arr };
    const combined: Record<string, unknown> = {};
    for (const item of arr) {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        Object.assign(combined, item);
      }
    }
    return { output: combined };
  },

  "logic.loop": ({ node, input, log }) => {
    const c = cfg(node);
    const ctx = asContext(input);
    const arr = getPath(ctx, String(c.arrayPath || "items"));
    const max = Math.max(1, Number(c.maxIterations) || 25);
    const items = Array.isArray(arr) ? arr.slice(0, max) : [];
    log("info", `Loop over ${items.length} item(s)`);
    return { output: items, items };
  },

  /* data */
  "data.set": ({ node, input }) => {
    const c = cfg(node);
    const ctx = asContext(input);
    const base = c.keepExisting === false ? {} : { ...ctx };
    const fields = (c.fields || {}) as Record<string, string>;
    for (const [k, v] of Object.entries(fields)) {
      if (k) base[k] = resolveTemplate(String(v), ctx);
    }
    return { output: base };
  },

  "data.transform": ({ node, input }) => {
    const c = cfg(node);
    const ctx = asContext(input);
    const mapping = (c.mapping || {}) as Record<string, string>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(mapping)) {
      if (k) out[k] = resolveTemplate(String(v), ctx);
    }
    return { output: out };
  },

  "data.code": ({ node, input, log }) => {
    const code = String(cfg(node).code || "return input;");
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(
        "input",
        "console",
        `"use strict";\n${/\breturn\b/.test(code) ? code : `return (${code});`}`
      );
      const fakeConsole = {
        log: (...a: unknown[]) => log("info", a.map(String).join(" ")),
        warn: (...a: unknown[]) => log("warn", a.map(String).join(" ")),
        error: (...a: unknown[]) => log("error", a.map(String).join(" ")),
      };
      const result = fn(input, fakeConsole);
      return { output: result };
    } catch (e) {
      throw new Error(`Code node error: ${(e as Error).message}`);
    }
  },

  "data.template": ({ node, input }) => {
    const c = cfg(node);
    const ctx = asContext(input);
    const text = resolveToString(String(c.template || ""), ctx);
    const key = String(c.outputKey || "text");
    return { output: { ...ctx, [key]: text } };
  },

  "data.math": ({ node, input }) => {
    const c = cfg(node);
    const ctx = asContext(input);
    const resolved = resolveToString(String(c.expression || "0"), ctx);
    let value: number;
    try {
      // only digits and math operators remain after template resolution
      if (!/^[\d\s+\-*/%.()]+$/.test(resolved)) throw new Error("non-numeric");
      // eslint-disable-next-line no-new-func
      value = Number(new Function(`"use strict"; return (${resolved});`)());
    } catch {
      value = NaN;
    }
    const key = String(c.outputKey || "result");
    return { output: { ...ctx, [key]: value } };
  },

  /* ai */
  "ai.generate": async ({ node, input, log }) => {
    const c = cfg(node);
    const ctx = asContext(input);
    const prompt = resolveToString(String(c.prompt || ""), ctx);
    const key = String(c.outputKey || "completion");
    const mode = String(c.mode || "smart");

    const apiKey =
      typeof process !== "undefined" ? process.env.OPENAI_API_KEY : undefined;

    if (apiKey) {
      try {
        log("info", "Calling OpenAI (live mode)…");
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.4,
          }),
        });
        const json = await res.json();
        const text = json?.choices?.[0]?.message?.content ?? "";
        return { output: { ...ctx, [key]: text, _aiMode: "openai" } };
      } catch (e) {
        log("warn", `OpenAI failed, using offline mock: ${(e as Error).message}`);
      }
    }

    log("info", `AI offline mock (${mode})`);
    const text = offlineAI(prompt, mode);
    return { output: { ...ctx, [key]: text, _aiMode: `mock:${mode}` } };
  },
};

/* --------------------------- offline AI fallback -------------------------- */

function offlineAI(prompt: string, mode: string): string {
  const content = prompt.replace(/^[^:]*:/, "").trim() || prompt;
  if (mode === "sentiment") {
    const pos = ["great", "love", "excellent", "happy", "good", "amazing", "awesome", "nice", "best"];
    const neg = ["bad", "hate", "terrible", "angry", "poor", "worst", "awful", "broken", "fail"];
    const lc = content.toLowerCase();
    const p = pos.filter((w) => lc.includes(w)).length;
    const n = neg.filter((w) => lc.includes(w)).length;
    const label = p > n ? "positive" : n > p ? "negative" : "neutral";
    return `${label} (positive signals: ${p}, negative signals: ${n})`;
  }
  if (mode === "keywords") {
    const stop = new Set(["the", "a", "an", "and", "or", "is", "to", "of", "in", "on", "for", "with", "this", "that", "it", "as", "at", "by", "from"]);
    const words = content.toLowerCase().match(/[a-z]{3,}/g) || [];
    const freq: Record<string, number> = {};
    for (const w of words) if (!stop.has(w)) freq[w] = (freq[w] || 0) + 1;
    const top = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([w]) => w);
    return top.join(", ") || "(no keywords found)";
  }
  // smart summary mock
  const sentences = content.split(/(?<=[.!?])\s+/).filter(Boolean);
  const first = sentences[0] || content;
  const words = content.split(/\s+/).length;
  const summary = first.length > 160 ? first.slice(0, 157) + "…" : first;
  return `${summary} (summarized ${words} words → 1 sentence, offline mode)`;
}

/* -------------------------------- dispatch -------------------------------- */

export function hasExecutor(type: string): boolean {
  return type in executors;
}

export async function runNode(ctx: ExecContext): Promise<ExecResult> {
  const exec = executors[ctx.node.data.type];
  if (!exec) {
    throw new Error(`No executor for node type "${ctx.node.data.type}"`);
  }
  return exec(ctx);
}
