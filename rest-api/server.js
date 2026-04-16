const express = require("express");

const app = express();
app.use(express.json());

// ── In-memory store ──────────────────────────────────────────────────────────
let students = [
  { id: 1, name: "Rodrigo" },
  { id: 2, name: "Maria" },
  { id: 3, name: "Carlos" },
];

let grades = [
  { id: 1, studentId: 1, subject: "Math", grade: 8 },
  { id: 2, studentId: 1, subject: "AI", grade: 7 },
  { id: 3, studentId: 2, subject: "Math", grade: 9 },
  { id: 4, studentId: 3, subject: "AI", grade: 6 },
];

let nextStudentId = 4;
let nextGradeId = 5;

// ── Helpers ──────────────────────────────────────────────────────────────────
const notFound = (res, msg) => res.status(404).json({ error: msg });
const badRequest = (res, msg) => res.status(400).json({ error: msg });

// ── Students ─────────────────────────────────────────────────────────────────

// GET /students
app.get("/students", (req, res) => {
  res.json(students);
});

// GET /students/:id
app.get("/students/:id", (req, res) => {
  const student = students.find((s) => s.id === Number(req.params.id));
  if (!student) return notFound(res, "Student not found");
  res.json(student);
});

// POST /students
app.post("/students", (req, res) => {
  const { name } = req.body;
  if (!name) return badRequest(res, "name is required");
  const student = { id: nextStudentId++, name };
  students.push(student);
  res.status(201).json(student);
});

// PUT /students/:id
app.put("/students/:id", (req, res) => {
  const idx = students.findIndex((s) => s.id === Number(req.params.id));
  if (idx === -1) return notFound(res, "Student not found");
  const { name } = req.body;
  if (!name) return badRequest(res, "name is required");
  students[idx] = { ...students[idx], name };
  res.json(students[idx]);
});

// DELETE /students/:id
app.delete("/students/:id", (req, res) => {
  const idx = students.findIndex((s) => s.id === Number(req.params.id));
  if (idx === -1) return notFound(res, "Student not found");
  const [removed] = students.splice(idx, 1);
  // cascade-delete grades
  grades = grades.filter((g) => g.studentId !== removed.id);
  res.json({ message: "Student deleted", student: removed });
});

// ── Grades ───────────────────────────────────────────────────────────────────

// GET /grades
app.get("/grades", (req, res) => {
  // Join student name for convenience
  const enriched = grades.map((g) => {
    const student = students.find((s) => s.id === g.studentId);
    return { ...g, studentName: student ? student.name : "Unknown" };
  });
  res.json(enriched);
});

// GET /grades/:id
app.get("/grades/:id", (req, res) => {
  const grade = grades.find((g) => g.id === Number(req.params.id));
  if (!grade) return notFound(res, "Grade not found");
  const student = students.find((s) => s.id === grade.studentId);
  res.json({ ...grade, studentName: student ? student.name : "Unknown" });
});

// POST /grades
app.post("/grades", (req, res) => {
  const { studentId, subject, grade } = req.body;
  if (!studentId || !subject || grade === undefined)
    return badRequest(res, "studentId, subject and grade are required");
  if (!students.find((s) => s.id === Number(studentId)))
    return notFound(res, "Student not found");
  const newGrade = {
    id: nextGradeId++,
    studentId: Number(studentId),
    subject,
    grade: Number(grade),
  };
  grades.push(newGrade);
  res.status(201).json(newGrade);
});

// PUT /grades/:id  — also supports updating by studentName + subject
app.put("/grades/:id", (req, res) => {
  const idx = grades.findIndex((g) => g.id === Number(req.params.id));
  if (idx === -1) return notFound(res, "Grade not found");
  const { grade } = req.body;
  if (grade === undefined) return badRequest(res, "grade is required");
  grades[idx] = { ...grades[idx], grade: Number(grade) };
  res.json(grades[idx]);
});

// DELETE /grades/:id
app.delete("/grades/:id", (req, res) => {
  const idx = grades.findIndex((g) => g.id === Number(req.params.id));
  if (idx === -1) return notFound(res, "Grade not found");
  const [removed] = grades.splice(idx, 1);
  res.json({ message: "Grade deleted", grade: removed });
});

// ── Convenience: set grade by student name + subject ─────────────────────────
// PATCH /grades/by-name
app.patch("/grades/by-name", (req, res) => {
  const { studentName, subject, grade } = req.body;
  if (!studentName || !subject || grade === undefined)
    return badRequest(res, "studentName, subject and grade are required");

  const student = students.find(
    (s) => s.name.toLowerCase() === studentName.toLowerCase()
  );
  if (!student) return notFound(res, `Student '${studentName}' not found`);

  const idx = grades.findIndex(
    (g) =>
      g.studentId === student.id &&
      g.subject.toLowerCase() === subject.toLowerCase()
  );

  if (idx !== -1) {
    // update existing
    grades[idx] = { ...grades[idx], grade: Number(grade) };
    return res.json({ action: "updated", grade: grades[idx] });
  } else {
    // create new
    const newGrade = {
      id: nextGradeId++,
      studentId: student.id,
      subject,
      grade: Number(grade),
    };
    grades.push(newGrade);
    return res.status(201).json({ action: "created", grade: newGrade });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Grades REST API running on http://localhost:${PORT}`);
});
