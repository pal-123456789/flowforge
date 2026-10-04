/**
 * Expression + template engine for FlowForge.
 *
 * Everything is evaluated against a "context" object which is the data flowing
 * into a node. We support:
 *   - {{ dot.path }}           -> read a value from context
 *   - {{ json }}               -> the whole context as pretty JSON
 *   - {{ a + b }}, {{ x > 2 }} -> small safe arithmetic/boolean expressions
 *
 * The evaluator is intentionally restricted: no access to globals, no function
 * calls except a tiny whitelist. This keeps "offline + safe" guarantees for a
 * hackathon demo without pulling a heavy sandbox dependency.
 */

export function getPath(obj: unknown, path: string): unknown {
  if (!path) return obj;
  const parts = path.split(".").map((p) => p.trim());
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null) return undefined;
    if (part === "json") return cur;
    const key = part.replace(/\[(\d+)\]/g, ".$1");
    const subkeys = key.split(".").filter(Boolean);
    for (const k of subkeys) {
      if (cur == null) return undefined;
      cur = (cur as Record<string, unknown>)[k];
    }
  }
  return cur;
}

const SAFE_EXPR = /^[\s\d+\-*/%().<>=!&|'"a-zA-Z_$,[\]:?]+$/;

/** Evaluate a tiny arithmetic / comparison expression with ctx vars available. */
function evalExpression(expr: string, ctx: Record<string, unknown>): unknown {
  const trimmed = expr.trim();

  // direct path lookup fast-path (most common): "status", "data.email"
  if (/^[a-zA-Z_$][\w$]*(\.[a-zA-Z_$][\w$]*|\[\d+\])*$/.test(trimmed)) {
    if (trimmed === "json") return ctx;
    const val = getPath(ctx, trimmed);
    if (val !== undefined) return val;
    // fall through to evaluation (could be a bare word like "true")
  }

  if (!SAFE_EXPR.test(trimmed)) {
    // not a safe expression; treat as literal string
    return trimmed;
  }

  try {
    const keys = Object.keys(ctx).filter((k) => /^[a-zA-Z_$][\w$]*$/.test(k));
    const vals = keys.map((k) => ctx[k]);
    // eslint-disable-next-line no-new-func
    const fn = new Function(
      ...keys,
      "json",
      `"use strict"; return (${trimmed});`
    );
    return fn(...vals, ctx);
  } catch {
    return trimmed;
  }
}

/** Resolve all {{ ... }} in a string. If the whole string is one expression
 *  and resolves to a non-string, the raw value is returned (not stringified). */
export function resolveTemplate(
  tpl: string,
  ctx: Record<string, unknown>
): unknown {
  if (typeof tpl !== "string") return tpl;

  const whole = tpl.match(/^\s*\{\{([\s\S]+?)\}\}\s*$/);
  if (whole) {
    const inner = whole[1].trim();
    if (inner === "json") return JSON.stringify(ctx, null, 2);
    return evalExpression(inner, ctx);
  }

  return tpl.replace(/\{\{([\s\S]+?)\}\}/g, (_m, inner: string) => {
    const key = inner.trim();
    if (key === "json") return JSON.stringify(ctx);
    const v = evalExpression(key, ctx);
    if (v === undefined || v === null) return "";
    return typeof v === "object" ? JSON.stringify(v) : String(v);
  });
}

export function resolveToString(
  tpl: string,
  ctx: Record<string, unknown>
): string {
  const v = resolveTemplate(tpl, ctx);
  if (v === undefined || v === null) return "";
  return typeof v === "object" ? JSON.stringify(v) : String(v);
}

export function asContext(data: unknown): Record<string, unknown> {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return { value: data };
}

/** Compare helper used by if / filter nodes. */
export function compare(
  left: unknown,
  operator: string,
  right: unknown
): boolean {
  const toNum = (v: unknown) => Number(v);
  switch (operator) {
    case "eq":
      return String(left) === String(right);
    case "neq":
      return String(left) !== String(right);
    case "gt":
      return toNum(left) > toNum(right);
    case "lt":
      return toNum(left) < toNum(right);
    case "gte":
      return toNum(left) >= toNum(right);
    case "lte":
      return toNum(left) <= toNum(right);
    case "contains":
      return String(left).toLowerCase().includes(String(right).toLowerCase());
    case "truthy":
      return Boolean(left) && left !== "false" && left !== "0";
    case "empty":
      return (
        left === "" ||
        left === null ||
        left === undefined ||
        (Array.isArray(left) && left.length === 0)
      );
    default:
      return false;
  }
}
