# Grades REST API + MCP Server

## Project layout

```
MCP/
├── rest-api/          Express REST API (port 3000)
│   └── server.js
├── mcp-server/        MCP server (stdio transport)
│   └── index.js
└── claude_desktop_config.json   ← copy into Claude Desktop config
```

---

## Step 1 — Start the REST API

```bash
cd rest-api
npm install
npm start
```

The API will be available at `http://localhost:3000`.

### Endpoints

| Method | Path                  | Description                             |
|--------|-----------------------|-----------------------------------------|
| GET    | /students             | List all students                       |
| GET    | /students/:id         | Get student by ID                       |
| POST   | /students             | Create student `{ name }`               |
| PUT    | /students/:id         | Rename student `{ name }`               |
| DELETE | /students/:id         | Delete student + cascade grades         |
| GET    | /grades               | List all grades (with student name)     |
| GET    | /grades/:id           | Get grade by ID                         |
| POST   | /grades               | Create grade `{ studentId, subject, grade }` |
| PUT    | /grades/:id           | Update grade value `{ grade }`          |
| DELETE | /grades/:id           | Delete grade                            |
| PATCH  | /grades/by-name       | Set grade by name `{ studentName, subject, grade }` |

---

## Step 2 — Wire up the MCP Server in Claude Desktop

1. Open (or create) your Claude Desktop config file:
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

2. Paste the contents of `claude_desktop_config.json` from this repo (or merge the `mcpServers` key into your existing config).

3. **Restart Claude Desktop.**

---

## Step 3 — Talk to Claude

With both the REST API running and Claude Desktop restarted, you can ask:

> "Set Rodrigo's grade to 10 in subject: AI"

> "What are all the grades of the students?"

> "Add a new student called Ana"

> "Delete Carlos"

Claude will use the MCP tools (`set_grade_by_name`, `list_grades`, `create_student`, etc.) to call your live REST API.

---

## MCP Tools exposed

| Tool name           | What it does                                      |
|---------------------|---------------------------------------------------|
| `list_students`     | GET /students                                     |
| `get_student`       | GET /students/:id                                 |
| `create_student`    | POST /students                                    |
| `update_student`    | PUT /students/:id                                 |
| `delete_student`    | DELETE /students/:id                              |
| `list_grades`       | GET /grades                                       |
| `get_grade`         | GET /grades/:id                                   |
| `create_grade`      | POST /grades                                      |
| `update_grade`      | PUT /grades/:id                                   |
| `delete_grade`      | DELETE /grades/:id                                |
| `set_grade_by_name` | PATCH /grades/by-name (natural-language friendly) |
