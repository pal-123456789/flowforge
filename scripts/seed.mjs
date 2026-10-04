// FlowForge seed script — populates data/workflows with the built-in templates
// so a fresh clone has demo content on the dashboard immediately.
//
//   npm run seed
//
// Safe to run multiple times (it overwrites the same seeded ids).

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const WF_DIR = path.join(ROOT, "data", "workflows");

function id(n) {
  return "seed_" + n;
}

const now = new Date().toISOString();

// Minimal standalone builders (kept in sync with src/lib/templates.ts) so the
// seed script has zero dependency on the TypeScript build.
function node(nid, type, label, position, config) {
  return { id: nid, type: "flowNode", position, data: { type, label, config } };
}
function edge(source, target, sourceHandle = "out") {
  return {
    id: `e_${source}_${target}`,
    source,
    target,
    sourceHandle,
    animated: true,
  };
}

const workflows = [
  {
    id: id("welcome-email"),
    name: "New Signup → Welcome Email",
    description:
      "A webhook receives a signup, filters out missing emails, personalizes a message, and sends a welcome email.",
    tags: ["onboarding", "webhook", "email"],
    nodes: [
      node("n1", "trigger.webhook", "Webhook", { x: 40, y: 160 }, {
        sample: '{\n  "name": "Ada",\n  "email": "ada@example.com",\n  "plan": "pro"\n}',
      }),
      node("n2", "logic.filter", "Filter", { x: 340, y: 160 }, {
        left: "{{email}}",
        operator: "contains",
        right: "@",
      }),
      node("n3", "data.template", "Template", { x: 640, y: 160 }, {
        template: "Hi {{name}}, welcome aboard the {{plan}} plan!",
        outputKey: "greeting",
      }),
      node("n4", "action.email", "Send Email", { x: 940, y: 160 }, {
        to: "{{email}}",
        subject: "Welcome to FlowForge, {{name}}!",
        body: "{{greeting}}\n\nWe're thrilled to have you.",
      }),
    ],
    edges: [edge("n1", "n2"), edge("n2", "n3"), edge("n3", "n4")],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: id("sentiment-router"),
    name: "AI Sentiment → Smart Routing",
    description:
      "Classify incoming feedback sentiment with the AI node, then branch: happy customers get a thank-you, unhappy ones escalate.",
    tags: ["ai", "branching", "support"],
    nodes: [
      node("n1", "trigger.manual", "Manual Trigger", { x: 40, y: 220 }, {
        payload:
          '{\n  "customer": "Sam",\n  "message": "This product is amazing, I love the fast support!"\n}',
      }),
      node("n2", "ai.generate", "AI", { x: 320, y: 220 }, {
        prompt: "Classify sentiment: {{message}}",
        mode: "sentiment",
        outputKey: "sentiment",
      }),
      node("n3", "logic.if", "If", { x: 620, y: 220 }, {
        left: "{{sentiment}}",
        operator: "contains",
        right: "positive",
      }),
      node("n4", "action.email", "Send Email", { x: 940, y: 100 }, {
        to: "{{customer}}",
        subject: "Thank you!",
        body: "Hi {{customer}}, thanks so much for the kind words!",
      }),
      node("n5", "action.log", "Log", { x: 940, y: 340 }, {
        message: "Escalating unhappy customer {{customer}}: {{message}}",
        level: "warn",
      }),
    ],
    edges: [
      edge("n1", "n2"),
      edge("n2", "n3"),
      edge("n3", "n4", "true"),
      edge("n3", "n5", "false"),
    ],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: id("order-pipeline"),
    name: "Order Processing Pipeline",
    description:
      "Compute order totals with the Math node, run custom JS to apply discounts, set a status field, and persist the result to a file.",
    tags: ["ecommerce", "code", "math", "file"],
    nodes: [
      node("n1", "trigger.manual", "Manual Trigger", { x: 40, y: 180 }, {
        payload:
          '{\n  "orderId": "A-1021",\n  "price": 49.99,\n  "qty": 3,\n  "customer": "Zoe"\n}',
      }),
      node("n2", "data.math", "Math", { x: 320, y: 180 }, {
        expression: "{{price}} * {{qty}}",
        outputKey: "subtotal",
      }),
      node("n3", "data.code", "Code", { x: 600, y: 180 }, {
        code:
          "const discount = input.subtotal > 100 ? 0.1 : 0;\nreturn {\n  ...input,\n  discount,\n  total: +(input.subtotal * (1 - discount)).toFixed(2),\n};",
      }),
      node("n4", "data.set", "Set", { x: 880, y: 180 }, {
        fields: { status: "confirmed" },
        keepExisting: true,
      }),
      node("n5", "action.writeFile", "Write File", { x: 1160, y: 180 }, {
        filename: "order-{{orderId}}.json",
        content: "{{json}}",
      }),
    ],
    edges: [
      edge("n1", "n2"),
      edge("n2", "n3"),
      edge("n3", "n4"),
      edge("n4", "n5"),
    ],
    createdAt: now,
    updatedAt: now,
  },
];

async function main() {
  await fs.mkdir(WF_DIR, { recursive: true });
  for (const wf of workflows) {
    await fs.writeFile(
      path.join(WF_DIR, `${wf.id}.json`),
      JSON.stringify(wf, null, 2),
      "utf8"
    );
    console.log(`  seeded ${wf.name}`);
  }
  console.log(`\n✓ Seeded ${workflows.length} workflows into data/workflows`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
