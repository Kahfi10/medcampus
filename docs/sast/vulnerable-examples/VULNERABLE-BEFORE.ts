// ============================================================
// VULNERABLE-BEFORE.ts — Contoh kode RENTAN (JANGAN dipakai di produksi)
// File ini dibuat khusus untuk demonstrasi SAST BAB V UTS
// ============================================================

import express from "express";
import mysql from "mysql2";

const app = express();
const db = mysql.createConnection({
  // SAST-01: Hardcoded credential (A05 Security Misconfiguration)
  host: "localhost",
  user: "root",
  password: "Admin@123",          // ← HARDCODED PASSWORD
  database: "medcampus_db",
});

// SAST-02: SQL Injection — raw string concatenation (A03 Injection)
app.get("/api/users/search", (req, res) => {
  const { name } = req.query;
  // Query dibentuk dari input pengguna langsung — SQL INJECTION RISK
  const query = `SELECT * FROM user WHERE nama = '${name}'`;
  db.query(query, (err, results) => {
    if (err) {
      // SAST-03: Verbose error — Information Disclosure (A05)
      res.status(500).json({ error: err.message, stack: err.stack });
      return;
    }
    res.json(results);
  });
});

// SAST-04: Password disimpan tanpa hashing (A02 Cryptographic Failures)
app.post("/api/auth/register", (req, res) => {
  const { email, password } = req.body;
  // Password langsung disimpan ke database TANPA hashing
  db.query(
    `INSERT INTO user (email, password) VALUES ('${email}', '${password}')`,
    (err) => {
      if (err) res.status(500).json({ error: err.message });
      else res.json({ success: true });
    }
  );
});

// SAST-05: Tidak ada validasi ownership — IDOR (A01 Broken Access Control)
app.get("/api/rekam-medis/:id", (req, res) => {
  const { id } = req.params;
  // Tidak ada pengecekan apakah user yang request adalah pemilik data
  db.query(
    `SELECT * FROM rekammedis WHERE id = '${id}'`,  // juga SQL Injection
    (err, results) => {
      res.json(results);
    }
  );
});

// SAST-06: Tidak ada rate limiting pada endpoint login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  // Tidak ada rate limiting → brute force tidak dicegah (A07)
  db.query(
    `SELECT * FROM user WHERE email='${email}' AND password='${password}'`,
    (err, results: any[]) => {
      if (results && results.length > 0) {
        res.json({ success: true, token: "hardcoded-token-123" }); // SAST-07: hardcoded token
      } else {
        res.json({ success: false, message: "Invalid credentials" });
      }
    }
  );
});

export default app;
