import type { Workflow, FlowNode, FlowEdge } from "./types";
import { getNodeDef } from "./nodeRegistry";
import { nanoid } from "nanoid";

export function makeNode(
  type: string,
  position: { x: number; y: number },
  configOverride: Record<string, unknown> = {},
  id?: string
): FlowNode {
  const def = getNodeDef(type);
  if (!def) throw new Error(`Unknown node type ${type}`);
  return {
    id: id || `n_${nanoid(6)}`,
    type: "flowNode",
    position,
    data: {
      type,
      label: def.label,
      config: { ...def.defaults, ...configOverride },
    },
  };
}

export function makeEdge(
  source: string,
  target: string,
  sourceHandle = "out"
): FlowEdge {
  return {
    id: `e_${nanoid(6)}`,
    source,
    target,
    sourceHandle,
    animated: true,
  };
}

function now() {
  return new Date().toISOString();
}

/* ----------------------------- the templates ----------------------------- */

interface TemplateDef {
  id: string;
  name: string;
  description: string;
  tags: string[];
  build: () => { nodes: FlowNode[]; edges: FlowEdge[] };
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: "tpl-welcome-email",
    name: "New Signup → Welcome Email",
    description:
      "A webhook receives a signup, filters out missing emails, personalizes a message, and sends a welcome email.",
    tags: ["onboarding", "webhook", "email"],
    build: () => {
      const t = makeNode("trigger.webhook", { x: 40, y: 160 }, {
        sample: '{\n  "name": "Ada",\n  "email": "ada@example.com",\n  "plan": "pro"\n}',
      });
      const filter = makeNode("logic.filter", { x: 340, y: 160 }, {
        left: "{{email}}",
        operator: "contains",
        right: "@",
      });
      const tmpl = makeNode("data.template", { x: 640, y: 160 }, {
        template: "Hi {{name}}, welcome aboard the {{plan}} plan! 🎉",
        outputKey: "greeting",
      });
      const email = makeNode("action.email", { x: 940, y: 160 }, {
        to: "{{email}}",
        subject: "Welcome to FlowForge, {{name}}!",
        body: "{{greeting}}\n\nWe're thrilled to have you.",
      });
      return {
        nodes: [t, filter, tmpl, email],
        edges: [
          makeEdge(t.id, filter.id),
          makeEdge(filter.id, tmpl.id),
          makeEdge(tmpl.id, email.id),
        ],
      };
    },
  },
  {
    id: "tpl-api-enrich",
    name: "Fetch API → Transform → Log",
    description:
      "Manually trigger an HTTP request to a public API, reshape the JSON response, and log the clean result.",
    tags: ["http", "transform", "api"],
    build: () => {
      const t = makeNode("trigger.manual", { x: 40, y: 160 });
      const http = makeNode("action.http", { x: 320, y: 160 }, {
        method: "GET",
        url: "https://jsonplaceholder.typicode.com/users/1",
      });
      const transform = makeNode("data.transform", { x: 620, y: 160 }, {
        mapping: {
          userId: "{{data.id}}",
          fullName: "{{data.name}}",
          city: "{{data.address.city}}",
          company: "{{data.company.name}}",
        },
      });
      const log = makeNode("action.log", { x: 920, y: 160 }, {
        message: "Enriched user: {{json}}",
      });
      return {
        nodes: [t, http, transform, log],
        edges: [
          makeEdge(t.id, http.id),
          makeEdge(http.id, transform.id),
          makeEdge(transform.id, log.id),
        ],
      };
    },
  },
  {
    id: "tpl-sentiment-router",
    name: "AI Sentiment → Smart Routing",
    description:
      "Classify incoming feedback sentiment with the AI node, then branch: happy customers get a thank-you, unhappy ones escalate.",
    tags: ["ai", "branching", "support"],
    build: () => {
      const t = makeNode("trigger.manual", { x: 40, y: 220 }, {
        payload: '{\n  "customer": "Sam",\n  "message": "This product is amazing, I love the fast support!"\n}',
      });
      const ai = makeNode("ai.generate", { x: 320, y: 220 }, {
        prompt: "Classify sentiment: {{message}}",
        mode: "sentiment",
        outputKey: "sentiment",
      });
      const cond = makeNode("logic.if", { x: 620, y: 220 }, {
        left: "{{sentiment}}",
        operator: "contains",
        right: "positive",
      });
      const thanks = makeNode("action.email", { x: 940, y: 100 }, {
        to: "{{customer}}",
        subject: "Thank you! 💜",
        body: "Hi {{customer}}, thanks so much for the kind words!",
      });
      const escalate = makeNode("action.log", { x: 940, y: 340 }, {
        message: "⚠️ Escalating unhappy customer {{customer}}: {{message}}",
        level: "warn",
      });
      return {
        nodes: [t, ai, cond, thanks, escalate],
        edges: [
          makeEdge(t.id, ai.id),
          makeEdge(ai.id, cond.id),
          makeEdge(cond.id, thanks.id, "true"),
          makeEdge(cond.id, escalate.id, "false"),
        ],
      };
    },
  },
  {
    id: "tpl-order-pipeline",
    name: "Order Processing Pipeline",
    description:
      "Compute order totals with the Math node, run custom JS to apply discounts, set a status field, and persist the result to a file.",
    tags: ["ecommerce", "code", "math", "file"],
    build: () => {
      const t = makeNode("trigger.manual", { x: 40, y: 180 }, {
        payload: '{\n  "orderId": "A-1021",\n  "price": 49.99,\n  "qty": 3,\n  "customer": "Zoe"\n}',
      });
      const math = makeNode("data.math", { x: 320, y: 180 }, {
        expression: "{{price}} * {{qty}}",
        outputKey: "subtotal",
      });
      const code = makeNode("data.code", { x: 600, y: 180 }, {
        code:
          "const discount = input.subtotal > 100 ? 0.1 : 0;\nreturn {\n  ...input,\n  discount,\n  total: +(input.subtotal * (1 - discount)).toFixed(2),\n};",
      });
      const set = makeNode("data.set", { x: 880, y: 180 }, {
        fields: { status: "confirmed" },
        keepExisting: true,
      });
      const write = makeNode("action.writeFile", { x: 1160, y: 180 }, {
        filename: "order-{{orderId}}.json",
        content: "{{json}}",
      });
      return {
        nodes: [t, math, code, set, write],
        edges: [
          makeEdge(t.id, math.id),
          makeEdge(math.id, code.id),
          makeEdge(code.id, set.id),
          makeEdge(set.id, write.id),
        ],
      };
    },
  },
  {
    id: "tpl-scheduled-digest",
    name: "Scheduled Health Check",
    description:
      "On a schedule, ping an API, branch on the HTTP status with a Switch, and log the outcome per status class.",
    tags: ["schedule", "monitoring", "switch"],
    build: () => {
      const t = makeNode("trigger.schedule", { x: 40, y: 240 }, {
        cron: "*/5 * * * *",
      });
      const http = makeNode("action.http", { x: 320, y: 240 }, {
        method: "GET",
        url: "https://jsonplaceholder.typicode.com/posts/1",
      });
      const code = makeNode("data.code", { x: 600, y: 240 }, {
        code:
          "return { ...input, statusClass: input.status < 300 ? 'ok' : input.status < 500 ? 'warn' : 'down' };",
      });
      const sw = makeNode("logic.switch", { x: 880, y: 240 }, {
        value: "{{statusClass}}",
        case1: "ok",
        case2: "warn",
        case3: "down",
      });
      const ok = makeNode("action.log", { x: 1180, y: 100 }, {
        message: "✅ Service healthy ({{status}})",
      });
      const warn = makeNode("action.log", { x: 1180, y: 240 }, {
        message: "⚠️ Degraded ({{status}})",
        level: "warn",
      });
      const down = makeNode("action.log", { x: 1180, y: 380 }, {
        message: "🚨 Service DOWN ({{status}})",
        level: "error",
      });
      return {
        nodes: [t, http, code, sw, ok, warn, down],
        edges: [
          makeEdge(t.id, http.id),
          makeEdge(http.id, code.id),
          makeEdge(code.id, sw.id),
          makeEdge(sw.id, ok.id, "case1"),
          makeEdge(sw.id, warn.id, "case2"),
          makeEdge(sw.id, down.id, "case3"),
        ],
      };
    },
  },
];

export function instantiateTemplate(templateId: string): Workflow {
  const tpl = TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) throw new Error(`Template ${templateId} not found`);
  const { nodes, edges } = tpl.build();
  const ts = now();
  return {
    id: `wf_${nanoid(8)}`,
    name: tpl.name,
    description: tpl.description,
    tags: tpl.tags,
    nodes,
    edges,
    createdAt: ts,
    updatedAt: ts,
  };
}

export function emptyWorkflow(name = "Untitled workflow"): Workflow {
  const ts = now();
  const trigger = makeNode("trigger.manual", { x: 120, y: 200 });
  return {
    id: `wf_${nanoid(8)}`,
    name,
    description: "",
    tags: [],
    nodes: [trigger],
    edges: [],
    createdAt: ts,
    updatedAt: ts,
  };
}
