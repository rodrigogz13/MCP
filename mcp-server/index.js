import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE = process.env.API_BASE ?? "http://localhost:3000";

// ── HTTP helper ──────────────────────────────────────────────────────────────
async function api(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

// ── MCP Server ───────────────────────────────────────────────────────────────
const server = new McpServer({
  name: "grades-server",
  version: "1.0.0",
});

// ── STUDENT tools ─────────────────────────────────────────────────────────────

server.tool(
  "list_students",
  "Return all students",
  {},
  async () => {
    const data = await api("GET", "/students");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "get_student",
  "Get a single student by ID",
  { id: z.number().describe("Student ID") },
  async ({ id }) => {
    const data = await api("GET", `/students/${id}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "create_student",
  "Create a new student",
  { name: z.string().describe("Student name") },
  async ({ name }) => {
    const data = await api("POST", "/students", { name });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "update_student",
  "Rename a student by ID",
  {
    id: z.number().describe("Student ID"),
    name: z.string().describe("New name"),
  },
  async ({ id, name }) => {
    const data = await api("PUT", `/students/${id}`, { name });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "delete_student",
  "Delete a student and all their grades by ID",
  { id: z.number().describe("Student ID") },
  async ({ id }) => {
    const data = await api("DELETE", `/students/${id}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ── GRADE tools ───────────────────────────────────────────────────────────────

server.tool(
  "list_grades",
  "Return all grades for all students",
  {},
  async () => {
    const data = await api("GET", "/grades");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "get_grade",
  "Get a single grade record by ID",
  { id: z.number().describe("Grade ID") },
  async ({ id }) => {
    const data = await api("GET", `/grades/${id}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "create_grade",
  "Create a new grade record using student ID",
  {
    studentId: z.number().describe("Student ID"),
    subject: z.string().describe("Subject name"),
    grade: z.number().describe("Grade value (e.g. 0–10)"),
  },
  async ({ studentId, subject, grade }) => {
    const data = await api("POST", "/grades", { studentId, subject, grade });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "update_grade",
  "Update a grade value by grade ID",
  {
    id: z.number().describe("Grade ID"),
    grade: z.number().describe("New grade value"),
  },
  async ({ id, grade }) => {
    const data = await api("PUT", `/grades/${id}`, { grade });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "delete_grade",
  "Delete a grade record by ID",
  { id: z.number().describe("Grade ID") },
  async ({ id }) => {
    const data = await api("DELETE", `/grades/${id}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "set_grade_by_name",
  "Set (create or update) a student's grade using their name and subject. Use this for natural-language requests like 'Set Rodrigo's grade to 10 in AI'.",
  {
    studentName: z.string().describe("Student's full name"),
    subject: z.string().describe("Subject name"),
    grade: z.number().describe("Grade value"),
  },
  async ({ studentName, subject, grade }) => {
    const data = await api("PATCH", "/grades/by-name", {
      studentName,
      subject,
      grade,
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ── Run ───────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
