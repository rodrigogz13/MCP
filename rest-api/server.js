import "dotenv/config";
import express from "express";
import mysql from "mysql2/promise";

const app = express();
app.use(express.json());

// ── DB pool ──────────────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST     ?? "localhost",
  port:     Number(process.env.DB_PORT ?? 3306),
  user:     process.env.DB_USER     ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME     ?? "grades_db",
});

// ── Helpers ──────────────────────────────────────────────────────────────────
const notFound   = (res, msg) => res.status(404).json({ error: msg });
const badRequest = (res, msg) => res.status(400).json({ error: msg });

// ── Students ─────────────────────────────────────────────────────────────────

// GET /students
app.get("/students", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM students");
  res.json(rows);
});

// GET /students/:id
app.get("/students/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM students WHERE id = ?", [req.params.id]);
  if (!rows.length) return notFound(res, "Student not found");
  res.json(rows[0]);
});

// POST /students
app.post("/students", async (req, res) => {
  const { name } = req.body;
  if (!name) return badRequest(res, "name is required");
  const [result] = await pool.query("INSERT INTO students (name) VALUES (?)", [name]);
  res.status(201).json({ id: result.insertId, name });
});

// PUT /students/:id
app.put("/students/:id", async (req, res) => {
  const { name } = req.body;
  if (!name) return badRequest(res, "name is required");
  const [result] = await pool.query("UPDATE students SET name = ? WHERE id = ?", [name, req.params.id]);
  if (!result.affectedRows) return notFound(res, "Student not found");
  res.json({ id: Number(req.params.id), name });
});

// DELETE /students/:id
app.delete("/students/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM students WHERE id = ?", [req.params.id]);
  if (!rows.length) return notFound(res, "Student not found");
  await pool.query("DELETE FROM students WHERE id = ?", [req.params.id]);
  res.json({ message: "Student deleted", student: rows[0] });
});

// ── Grades ───────────────────────────────────────────────────────────────────

// GET /grades
app.get("/grades", async (req, res) => {
  const [rows] = await pool.query(`
    SELECT g.*, s.name AS studentName
    FROM grades g
    JOIN students s ON s.id = g.student_id
  `);
  res.json(rows);
});

// GET /grades/:id
app.get("/grades/:id", async (req, res) => {
  const [rows] = await pool.query(`
    SELECT g.*, s.name AS studentName
    FROM grades g
    JOIN students s ON s.id = g.student_id
    WHERE g.id = ?
  `, [req.params.id]);
  if (!rows.length) return notFound(res, "Grade not found");
  res.json(rows[0]);
});

// POST /grades
app.post("/grades", async (req, res) => {
  const { studentId, subject, grade } = req.body;
  if (!studentId || !subject || grade === undefined)
    return badRequest(res, "studentId, subject and grade are required");
  const [students] = await pool.query("SELECT id FROM students WHERE id = ?", [studentId]);
  if (!students.length) return notFound(res, "Student not found");
  const [result] = await pool.query(
    "INSERT INTO grades (student_id, subject, grade) VALUES (?, ?, ?)",
    [studentId, subject, grade]
  );
  res.status(201).json({ id: result.insertId, studentId: Number(studentId), subject, grade: Number(grade) });
});

// PUT /grades/:id
app.put("/grades/:id", async (req, res) => {
  const { grade } = req.body;
  if (grade === undefined) return badRequest(res, "grade is required");
  const [result] = await pool.query("UPDATE grades SET grade = ? WHERE id = ?", [grade, req.params.id]);
  if (!result.affectedRows) return notFound(res, "Grade not found");
  const [rows] = await pool.query("SELECT * FROM grades WHERE id = ?", [req.params.id]);
  res.json(rows[0]);
});

// DELETE /grades/:id
app.delete("/grades/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM grades WHERE id = ?", [req.params.id]);
  if (!rows.length) return notFound(res, "Grade not found");
  await pool.query("DELETE FROM grades WHERE id = ?", [req.params.id]);
  res.json({ message: "Grade deleted", grade: rows[0] });
});

// PATCH /grades/by-name
app.patch("/grades/by-name", async (req, res) => {
  const { studentName, subject, grade } = req.body;
  if (!studentName || !subject || grade === undefined)
    return badRequest(res, "studentName, subject and grade are required");

  const [students] = await pool.query(
    "SELECT * FROM students WHERE LOWER(name) = LOWER(?)", [studentName]
  );
  if (!students.length) return notFound(res, `Student '${studentName}' not found`);
  const student = students[0];

  const [existing] = await pool.query(
    "SELECT * FROM grades WHERE student_id = ? AND LOWER(subject) = LOWER(?)",
    [student.id, subject]
  );

  if (existing.length) {
    await pool.query("UPDATE grades SET grade = ? WHERE id = ?", [grade, existing[0].id]);
    const [updated] = await pool.query("SELECT * FROM grades WHERE id = ?", [existing[0].id]);
    return res.json({ action: "updated", grade: updated[0] });
  } else {
    const [result] = await pool.query(
      "INSERT INTO grades (student_id, subject, grade) VALUES (?, ?, ?)",
      [student.id, subject, grade]
    );
    return res.status(201).json({
      action: "created",
      grade: { id: result.insertId, student_id: student.id, subject, grade: Number(grade) },
    });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Grades REST API running on http://localhost:${PORT}`);
});
