import type { NodeTypeDef, NodeCategory } from "./types";

/**
 * The FlowForge node registry.
 * Every node type the platform understands is declared here with its
 * category, I/O shape, and configuration schema. The editor renders from
 * this, and the execution engine dispatches on `type`.
 */

const OUT = [{ id: "out", label: "" }];

export const NODE_TYPES: NodeTypeDef[] = [
  /* ------------------------------- TRIGGERS ------------------------------- */
  {
    type: "trigger.manual",
    category: "trigger",
    label: "Manual Trigger",
    description: "Starts the workflow when you click Run. Great for testing.",
    icon: "Play",
    inputs: 0,
    outputs: OUT,
    fields: [
      {
        key: "payload",
        label: "Test payload (JSON)",
        type: "json",
        language: "json",
        help: "This object is passed as the initial data into the flow.",
        default: '{\n  "message": "Hello from FlowForge"\n}',
      },
    ],
    defaults: { payload: '{\n  "message": "Hello from FlowForge"\n}' },
  },
  {
    type: "trigger.webhook",
    category: "trigger",
    label: "Webhook",
    description: "Starts when an HTTP request hits this workflow's webhook URL.",
    icon: "Webhook",
    inputs: 0,
    outputs: OUT,
    fields: [
      {
        key: "method",
        label: "Expected method",
        type: "select",
        options: [
          { label: "POST", value: "POST" },
          { label: "GET", value: "GET" },
          { label: "PUT", value: "PUT" },
        ],
        default: "POST",
      },
      {
        key: "sample",
        label: "Sample body (used in test runs)",
        type: "json",
        language: "json",
        default: '{\n  "event": "signup",\n  "email": "user@example.com"\n}',
      },
    ],
    defaults: {
      method: "POST",
      sample: '{\n  "event": "signup",\n  "email": "user@example.com"\n}',
    },
  },
  {
    type: "trigger.schedule",
    category: "trigger",
    label: "Schedule",
    description: "Runs on a recurring schedule (cron expression).",
    icon: "Clock",
    inputs: 0,
    outputs: OUT,
    fields: [
      {
        key: "cron",
        label: "Cron expression",
        type: "text",
        placeholder: "*/5 * * * *",
        help: "Standard 5-field cron. Example: every 5 minutes = */5 * * * *",
        default: "*/5 * * * *",
      },
    ],
    defaults: { cron: "*/5 * * * *" },
  },
  {
    type: "trigger.interval",
    category: "trigger",
    label: "Interval",
    description: "Runs every N seconds while enabled.",
    icon: "Timer",
    inputs: 0,
    outputs: OUT,
    fields: [
      {
        key: "seconds",
        label: "Interval (seconds)",
        type: "number",
        default: 60,
      },
    ],
    defaults: { seconds: 60 },
  },

  /* -------------------------------- ACTIONS ------------------------------- */
  {
    type: "action.http",
    category: "action",
    label: "HTTP Request",
    description: "Make a real HTTP request to any URL and capture the response.",
    icon: "Globe",
    inputs: 1,
    outputs: OUT,
    fields: [
      {
        key: "method",
        label: "Method",
        type: "select",
        options: [
          { label: "GET", value: "GET" },
          { label: "POST", value: "POST" },
          { label: "PUT", value: "PUT" },
          { label: "PATCH", value: "PATCH" },
          { label: "DELETE", value: "DELETE" },
        ],
        default: "GET",
      },
      {
        key: "url",
        label: "URL",
        type: "text",
        placeholder: "https://api.example.com/data",
        help: "Supports {{expressions}} using data from upstream nodes.",
        default: "https://jsonplaceholder.typicode.com/todos/1",
      },
      {
        key: "headers",
        label: "Headers",
        type: "keyvalue",
        default: {},
      },
      {
        key: "body",
        label: "Request body (JSON)",
        type: "json",
        language: "json",
        showIf: { key: "method", equals: "POST" },
        default: "",
      },
    ],
    defaults: {
      method: "GET",
      url: "https://jsonplaceholder.typicode.com/todos/1",
      headers: {},
      body: "",
    },
  },
  {
    type: "action.email",
    category: "action",
    label: "Send Email",
    description:
      "Compose and 'send' an email. Runs in safe mock mode offline; logs the full message.",
    icon: "Mail",
    inputs: 1,
    outputs: OUT,
    fields: [
      { key: "to", label: "To", type: "text", placeholder: "{{email}}", default: "" },
      { key: "subject", label: "Subject", type: "text", default: "Notification from FlowForge" },
      {
        key: "body",
        label: "Body",
        type: "textarea",
        rows: 5,
        help: "Supports {{expressions}}.",
        default: "Hi {{name}},\n\nThis is an automated message.",
      },
    ],
    defaults: {
      to: "",
      subject: "Notification from FlowForge",
      body: "Hi {{name}},\n\nThis is an automated message.",
    },
  },
  {
    type: "action.log",
    category: "action",
    label: "Log",
    description: "Write a message to the run console. Perfect for debugging.",
    icon: "Terminal",
    inputs: 1,
    outputs: OUT,
    fields: [
      {
        key: "message",
        label: "Message",
        type: "textarea",
        rows: 3,
        default: "Data: {{json}}",
        help: "Use {{json}} to print the full incoming payload.",
      },
      {
        key: "level",
        label: "Level",
        type: "select",
        options: [
          { label: "Info", value: "info" },
          { label: "Warn", value: "warn" },
          { label: "Error", value: "error" },
          { label: "Debug", value: "debug" },
        ],
        default: "info",
      },
    ],
    defaults: { message: "Data: {{json}}", level: "info" },
  },
  {
    type: "action.delay",
    category: "action",
    label: "Delay",
    description: "Pause the workflow for a set number of milliseconds.",
    icon: "Hourglass",
    inputs: 1,
    outputs: OUT,
    fields: [
      { key: "ms", label: "Delay (ms)", type: "number", default: 800 },
    ],
    defaults: { ms: 800 },
  },
  {
    type: "action.writeFile",
    category: "action",
    label: "Write File",
    description: "Write incoming data to a file in the server's output folder.",
    icon: "FileText",
    inputs: 1,
    outputs: OUT,
    fields: [
      {
        key: "filename",
        label: "File name",
        type: "text",
        default: "output.json",
        help: "Saved under /data/outputs. Supports {{expressions}}.",
      },
      {
        key: "content",
        label: "Content",
        type: "textarea",
        rows: 4,
        default: "{{json}}",
      },
    ],
    defaults: { filename: "output.json", content: "{{json}}" },
  },

  /* --------------------------------- LOGIC -------------------------------- */
  {
    type: "logic.if",
    category: "logic",
    label: "If / Else",
    description: "Branch the flow based on a condition. Routes to True or False.",
    icon: "GitBranch",
    inputs: 1,
    outputs: [
      { id: "true", label: "True" },
      { id: "false", label: "False" },
    ],
    fields: [
      {
        key: "left",
        label: "Value / expression",
        type: "text",
        placeholder: "{{status}}",
        default: "{{value}}",
      },
      {
        key: "operator",
        label: "Operator",
        type: "select",
        options: [
          { label: "equals (==)", value: "eq" },
          { label: "not equals (!=)", value: "neq" },
          { label: "greater than (>)", value: "gt" },
          { label: "less than (<)", value: "lt" },
          { label: "greater or equal (>=)", value: "gte" },
          { label: "less or equal (<=)", value: "lte" },
          { label: "contains", value: "contains" },
          { label: "is truthy", value: "truthy" },
          { label: "is empty", value: "empty" },
        ],
        default: "eq",
      },
      {
        key: "right",
        label: "Compare to",
        type: "text",
        placeholder: "active",
        showIf: { key: "operator", equals: "eq" },
        default: "",
      },
    ],
    defaults: { left: "{{value}}", operator: "truthy", right: "" },
  },
  {
    type: "logic.switch",
    category: "logic",
    label: "Switch",
    description: "Route to one of several branches based on a value.",
    icon: "Split",
    inputs: 1,
    outputs: [
      { id: "case1", label: "Case 1" },
      { id: "case2", label: "Case 2" },
      { id: "case3", label: "Case 3" },
      { id: "default", label: "Default" },
    ],
    fields: [
      {
        key: "value",
        label: "Value / expression",
        type: "text",
        default: "{{type}}",
      },
      { key: "case1", label: "Case 1 matches", type: "text", default: "a" },
      { key: "case2", label: "Case 2 matches", type: "text", default: "b" },
      { key: "case3", label: "Case 3 matches", type: "text", default: "c" },
    ],
    defaults: { value: "{{type}}", case1: "a", case2: "b", case3: "c" },
  },
  {
    type: "logic.filter",
    category: "logic",
    label: "Filter",
    description:
      "Stop the branch unless the condition passes. If it fails, downstream nodes are skipped.",
    icon: "Filter",
    inputs: 1,
    outputs: OUT,
    fields: [
      { key: "left", label: "Value / expression", type: "text", default: "{{value}}" },
      {
        key: "operator",
        label: "Operator",
        type: "select",
        options: [
          { label: "equals", value: "eq" },
          { label: "not equals", value: "neq" },
          { label: "greater than", value: "gt" },
          { label: "less than", value: "lt" },
          { label: "contains", value: "contains" },
          { label: "is truthy", value: "truthy" },
        ],
        default: "truthy",
      },
      { key: "right", label: "Compare to", type: "text", default: "" },
    ],
    defaults: { left: "{{value}}", operator: "truthy", right: "" },
  },
  {
    type: "logic.merge",
    category: "logic",
    label: "Merge",
    description: "Wait for multiple branches and combine their data into one object.",
    icon: "Merge",
    inputs: 1,
    outputs: OUT,
    fields: [
      {
        key: "strategy",
        label: "Merge strategy",
        type: "select",
        options: [
          { label: "Combine (shallow merge)", value: "combine" },
          { label: "Array (collect all)", value: "array" },
        ],
        default: "combine",
      },
    ],
    defaults: { strategy: "combine" },
  },
  {
    type: "logic.loop",
    category: "logic",
    label: "Loop / Iterator",
    description: "Iterate over an array field; runs downstream nodes for each item.",
    icon: "Repeat",
    inputs: 1,
    outputs: [{ id: "each", label: "Each item" }],
    fields: [
      {
        key: "arrayPath",
        label: "Array field",
        type: "text",
        placeholder: "items",
        help: "Dot-path to the array in the incoming data (e.g. data.rows).",
        default: "items",
      },
      {
        key: "maxIterations",
        label: "Max iterations",
        type: "number",
        default: 25,
      },
    ],
    defaults: { arrayPath: "items", maxIterations: 25 },
  },

  /* ---------------------------------- DATA -------------------------------- */
  {
    type: "data.set",
    category: "data",
    label: "Set Fields",
    description: "Add or override fields on the data object using key/value pairs.",
    icon: "PencilRuler",
    inputs: 1,
    outputs: OUT,
    fields: [
      {
        key: "fields",
        label: "Fields to set",
        type: "keyvalue",
        help: "Values support {{expressions}}.",
        default: { status: "processed" },
      },
      {
        key: "keepExisting",
        label: "Keep existing fields",
        type: "boolean",
        default: true,
      },
    ],
    defaults: { fields: { status: "processed" }, keepExisting: true },
  },
  {
    type: "data.transform",
    category: "data",
    label: "JSON Transform",
    description:
      "Reshape the data by mapping output keys to expressions over the input.",
    icon: "Shuffle",
    inputs: 1,
    outputs: OUT,
    fields: [
      {
        key: "mapping",
        label: "Output mapping",
        type: "keyvalue",
        help: "Each value is an {{expression}} evaluated against the input.",
        default: { id: "{{id}}", name: "{{title}}" },
      },
    ],
    defaults: { mapping: { id: "{{id}}", name: "{{title}}" } },
  },
  {
    type: "data.code",
    category: "data",
    label: "Code (JS)",
    description:
      "Run sandboxed JavaScript. Receives `input`, returns any value as output.",
    icon: "Braces",
    inputs: 1,
    outputs: OUT,
    fields: [
      {
        key: "code",
        label: "JavaScript",
        type: "code",
        language: "javascript",
        rows: 10,
        help: "The last expression or an explicit `return` becomes the output. `input` is the incoming data.",
        default:
          "// Transform the incoming data\nreturn {\n  ...input,\n  processedAt: new Date().toISOString(),\n};",
      },
    ],
    defaults: {
      code:
        "// Transform the incoming data\nreturn {\n  ...input,\n  processedAt: new Date().toISOString(),\n};",
    },
  },
  {
    type: "data.template",
    category: "data",
    label: "Template",
    description: "Build a string from a template with {{expressions}}.",
    icon: "Type",
    inputs: 1,
    outputs: OUT,
    fields: [
      {
        key: "template",
        label: "Template",
        type: "textarea",
        rows: 4,
        default: "Hello {{name}}, your id is {{id}}.",
      },
      {
        key: "outputKey",
        label: "Output field name",
        type: "text",
        default: "text",
      },
    ],
    defaults: {
      template: "Hello {{name}}, your id is {{id}}.",
      outputKey: "text",
    },
  },
  {
    type: "data.math",
    category: "data",
    label: "Math",
    description: "Evaluate a numeric expression and store the result.",
    icon: "Calculator",
    inputs: 1,
    outputs: OUT,
    fields: [
      {
        key: "expression",
        label: "Expression",
        type: "text",
        placeholder: "{{price}} * {{qty}} * 1.2",
        default: "{{a}} + {{b}}",
      },
      { key: "outputKey", label: "Output field", type: "text", default: "result" },
    ],
    defaults: { expression: "{{a}} + {{b}}", outputKey: "result" },
  },

  /* ----------------------------------- AI --------------------------------- */
  {
    type: "ai.generate",
    category: "ai",
    label: "AI Generate",
    description:
      "Generate text from a prompt. Uses OpenAI if OPENAI_API_KEY is set, otherwise a built-in offline mock so it always runs.",
    icon: "Sparkles",
    inputs: 1,
    outputs: OUT,
    fields: [
      {
        key: "prompt",
        label: "Prompt",
        type: "textarea",
        rows: 5,
        help: "Supports {{expressions}} from upstream data.",
        default: "Summarize this in one friendly sentence: {{json}}",
      },
      {
        key: "outputKey",
        label: "Output field",
        type: "text",
        default: "completion",
      },
      {
        key: "mode",
        label: "Offline behaviour",
        type: "select",
        options: [
          { label: "Smart mock (summarize/echo)", value: "smart" },
          { label: "Sentiment classifier", value: "sentiment" },
          { label: "Keyword extractor", value: "keywords" },
        ],
        default: "smart",
      },
    ],
    defaults: {
      prompt: "Summarize this in one friendly sentence: {{json}}",
      outputKey: "completion",
      mode: "smart",
    },
  },
];

export const NODE_MAP: Record<string, NodeTypeDef> = Object.fromEntries(
  NODE_TYPES.map((n) => [n.type, n])
);

export function getNodeDef(type: string): NodeTypeDef | undefined {
  return NODE_MAP[type];
}

export const CATEGORY_META: Record<
  NodeCategory,
  { label: string; color: string; description: string }
> = {
  trigger: {
    label: "Triggers",
    color: "trigger",
    description: "Start a workflow",
  },
  action: { label: "Actions", color: "action", description: "Do something" },
  logic: { label: "Logic", color: "logic", description: "Branch & control flow" },
  data: { label: "Data", color: "data", description: "Shape & transform data" },
  ai: { label: "AI", color: "ai", description: "Intelligent steps" },
};

export const CATEGORY_HEX: Record<NodeCategory, string> = {
  trigger: "#22c55e",
  action: "#3b82f6",
  logic: "#f59e0b",
  data: "#ec4899",
  ai: "#06b6d4",
};

export function nodesByCategory(): Record<NodeCategory, NodeTypeDef[]> {
  const out: Record<NodeCategory, NodeTypeDef[]> = {
    trigger: [],
    action: [],
    logic: [],
    data: [],
    ai: [],
  };
  for (const n of NODE_TYPES) out[n.category].push(n);
  return out;
}
