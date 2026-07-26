<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=SF+Pro+Display&weight=700&size=42&pause=1000&color=0066CC&center=true&vCenter=true&width=600&height=80&lines=MedCampus;Rekam+Medis+Klinik+Kampus" alt="MedCampus" />

<p align="center">
  <strong>Sistem Rekam Medis Klinik Kampus berbasis Web</strong><br/>
  Dibangun dengan prinsip <em>Secure Software Development Lifecycle (SSDLC)</em>
</p>

<p align="center">
  <a href="https://medcampus.duckdns.org">
    <img src="https://img.shields.io/badge/🌐_Live_Demo-medcampus.duckdns.org-0066CC?style=for-the-badge&logoColor=white" alt="Live Demo"/>
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/Express.js-4.x-000000?style=flat-square&logo=express&logoColor=white"/>
  <img src="https://img.shields.io/badge/Prisma-5.x-2D3748?style=flat-square&logo=prisma&logoColor=white"/>
  <img src="https://img.shields.io/badge/MySQL-8.x-4479A1?style=flat-square&logo=mysql&logoColor=white"/>
  <img src="https://img.shields.io/badge/GSAP-3.x-88CE02?style=flat-square&logo=greensock&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OWASP_Top_10-Compliant-30B86A?style=flat-square"/>
  <img src="https://img.shields.io/badge/STRIDE-Threat_Modeled-FF9F0A?style=flat-square"/>
  <img src="https://img.shields.io/badge/SAST-ESLint_Security-5856D6?style=flat-square"/>
  <img src="https://img.shields.io/badge/SCA-npm_audit-FF3B30?style=flat-square"/>
  <img src="https://img.shields.io/badge/SSL-Certbot_HTTPS-30B86A?style=flat-square&logo=letsencrypt&logoColor=white"/>
</p>

<br/>

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   🏥  MedCampus — Where Security Meets Healthcare              │
│                                                                 │
│   Rekam medis digital · RBAC ketat · Audit trail lengkap       │
│   Threat modeled · SAST & SCA tested · Deployed & Secured      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

</div>

---

## ✨ Tentang MedCampus

**MedCampus** adalah platform pengelolaan rekam medis klinik kampus yang dirancang dengan **keamanan sebagai fondasi**, bukan tambahan. Setiap baris kode ditulis mengikuti prinsip *Secure Software Development Lifecycle (SSDLC)* — dari analisis ancaman hingga pengujian keamanan otomatis.

> *"Keamanan bukan fitur. Ini adalah fondasi."*

---

## 🏗️ Arsitektur Terdistribusi

```
                         Internet
                            │
                    ┌───────▼────────┐
                    │   DuckDNS      │
                    │ medcampus      │
                    │ .duckdns.org   │
                    └───────┬────────┘
                            │
              ┌─────────────▼─────────────────┐
              │   Oracle Cloud VM (ARM A1)     │
              │   Ubuntu 22.04 · 4 OCPU/24GB  │
              │                               │
              │  ┌────────────────────────┐   │
              │  │   Nginx + Certbot SSL  │   │
              │  │   Port 80/443          │   │
              │  └──────┬─────────────┬───┘   │
              │         │             │        │
              │   /      \        /api/*       │
              │         │             │        │
              │  ┌──────▼──┐   ┌──────▼──┐    │
              │  │ Next.js  │   │Express.js│   │
              │  │  :4000   │   │  :5000   │   │
              │  │  (PM2)   │   │  (PM2)   │   │
              │  └──────────┘   └────┬─────┘   │
              │                      │          │
              │               ┌──────▼───────┐  │
              │               │  MySQL :3306  │  │
              │               │ (local only)  │  │
              │               └──────────────┘  │
              └───────────────────────────────┘
```

---

## 🚀 Fitur Utama

### 👥 Multi-Role System
| Role | Kemampuan |
|------|-----------|
| 🔴 **Admin** | Kelola semua user, obat, kunjungan, audit log |
| 🟢 **Dokter** | Input rekam medis, kelola antrian, resep obat |
| 🔵 **Pasien** | Daftar kunjungan, lihat rekam medis sendiri |

### 🔐 Keamanan (OWASP Compliant)
- ✅ **Broken Access Control** — IDOR protection + ownership check
- ✅ **Cryptographic Failures** — bcrypt salt 12 untuk semua password
- ✅ **Injection** — Prisma ORM parameterized query (no raw SQL)
- ✅ **Auth Failures** — Rate limiting 5 req/15 menit pada login
- ✅ **Security Misconfiguration** — Helmet.js headers + .env secrets
- ✅ **Logging Failures** — AuditLog dengan 18 tipe aksi

### 🎨 UI/UX Premium
- **GSAP Animations** — ScrollTrigger, word reveal, counter animations
- **shadcn/ui** — Komponen UI yang dikustomisasi dengan Apple design tokens
- **Apple-Inspired** — Color palette, typography, dan spacing dari apple.com
- **Mobile Responsive** — Sidebar drawer, hamburger menu, adaptive layout
- **Toast Notifications** — Real-time feedback dengan GSAP slide-in
- **Skeleton Loading** — Loading state yang elegan

---

## 🛡️ Security Architecture

### Threat Modeling — STRIDE
```
12 ancaman diidentifikasi dan dimitigasi:
  ├── Spoofing        → bcrypt + rate limiting
  ├── Tampering       → Prisma ORM + input validation
  ├── Repudiation     → AuditLog dengan 18 aksi
  ├── Info Disclosure → Generic error + IDOR protection
  ├── DoS             → Rate limiting 100 req/menit global
  └── Privilege Esc   → RBAC middleware setiap endpoint
```

### SAST Results
```
Scan: ESLint Security Plugin
Before: 3 Critical + 4 High = 7 findings
After:  0 Critical + 0 High = 0 findings ✓
```

### SCA Results
```
Tool: npm audit
Server: 4 HIGH → 0 (yamljs removed) ✓
Client: Risk acceptance documented (dev deps only)
```

---

## 📦 Tech Stack

### Frontend (`apps/client`)
```
Next.js 14        — React framework (App Router)
TypeScript 5      — Type safety
Tailwind CSS 3    — Utility-first styling
shadcn/ui         — Accessible component library
GSAP 3            — Professional animations
                  └── ScrollTrigger, TextPlugin, Flip
```

### Backend (`apps/server`)
```
Express.js 4      — REST API framework
TypeScript 5      — Type safety
Prisma 5          — ORM + parameterized queries
bcryptjs          — Password hashing (salt 12)
jsonwebtoken      — JWT auth (1h access + 7d refresh)
helmet            — Security HTTP headers
express-rate-limit — Rate limiting & brute force protection
express-validator — Input validation & sanitization
morgan            — HTTP request logging
```

### Infrastructure
```
Oracle Cloud ARM  — VM.Standard.A1.Flex (4 OCPU / 24GB)
Ubuntu 22.04      — OS (aarch64)
PM2               — Process manager (cluster mode)
Nginx             — Reverse proxy + SSL termination
Certbot           — Let's Encrypt SSL certificate
DuckDNS           — Dynamic DNS
MySQL 8.x         — Database
```

---

## 📁 Struktur Project

```
medcampus/
├── apps/
│   ├── client/                    # Next.js 14 Frontend
│   │   ├── app/
│   │   │   ├── (auth)/            # Login, Register
│   │   │   └── (dashboard)/       # Dashboard per role
│   │   │       └── dashboard/
│   │   │           ├── admin/     # Admin pages
│   │   │           ├── dokter/    # Dokter pages
│   │   │           └── pasien/    # Pasien pages
│   │   ├── components/
│   │   │   ├── dashboard/         # Dashboard components
│   │   │   ├── sections/          # Landing page sections
│   │   │   └── ui/                # shadcn/ui components
│   │   └── lib/
│   │       ├── auth.ts            # Auth utilities
│   │       └── gsap.ts            # GSAP setup & helpers
│   │
│   └── server/                    # Express.js Backend
│       ├── src/
│       │   ├── controllers/       # Business logic
│       │   ├── middleware/        # Auth, RBAC, Error handler
│       │   ├── routes/            # API endpoints
│       │   └── utils/             # Prisma, Audit logger
│       └── prisma/
│           ├── schema.prisma      # Database schema
│           └── seed.ts            # Initial data seed
│
├── packages/
│   └── shared/                    # Shared TypeScript types
├── docs/
│   ├── docx/                      # Exported Word documents
│   ├── sast/                      # SAST reports & examples
│   └── sca/                       # SCA audit results
├── scripts/                       # Deployment scripts
├── ecosystem.config.js            # PM2 configuration
└── PRD.md                         # Product Requirements Document
```

---

## 🗄️ Database Schema

```
User ──────────── Kunjungan ──────── RekamMedis
 │                    │                  │
 │ (pasienId)         │                  ├── ResepObat
 │ (dokterId)         │                  │       │
 │                    │                  │    Obat
AuditLog         StatusKunjungan         │
                 ┌──────────────┐        │
                 │ MENUNGGU     │   ─────┘
                 │ DIPROSES     │
                 │ SELESAI      │
                 │ DIBATALKAN   │
                 └──────────────┘
```

---

## ⚡ Quick Start

### Prerequisites
```bash
node >= 20.x
npm >= 10.x
MySQL / MariaDB
```

### 1. Clone & Install
```bash
git clone https://github.com/Kahfi10/medcampus.git
cd medcampus
npm install
```

### 2. Environment Setup
```bash
# Server
cp apps/server/.env.example apps/server/.env
# Edit dengan kredensial database dan JWT secrets

# Client
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > apps/client/.env.local
```

### 3. Database Setup
```bash
cd apps/server
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
```

### 4. Generate JWT Secrets
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Jalankan 2x untuk JWT_SECRET dan JWT_REFRESH_SECRET
```

### 5. Run Development
```bash
# Terminal 1 — Backend
cd apps/server && npm run dev

# Terminal 2 — Frontend
cd apps/client && npm run dev
```

Buka: **http://localhost:3000**

---

## 🔑 Akun Default (Setelah Seed)

| Role | Email | Password |
|------|-------|----------|
| 👤 Admin | `admin@medcampus.id` | `Admin@123` |
| 👨‍⚕️ Dokter | `dokter@medcampus.id` | `Dokter@123` |
| 🧑 Pasien | `pasien@medcampus.id` | `Pasien@123` |

> ⚠️ **Ganti password default setelah login pertama**

---

## 🌐 API Endpoints

```
Auth
  POST   /api/auth/register     Registrasi pasien
  POST   /api/auth/login        Login (rate limited: 5/15min)
  POST   /api/auth/logout       Logout
  POST   /api/auth/refresh      Refresh JWT token
  GET    /api/auth/me           Profil current user

Kunjungan
  GET    /api/kunjungan         List kunjungan (Admin/Dokter)
  GET    /api/kunjungan/saya    Kunjungan milik pasien
  POST   /api/kunjungan         Buat kunjungan baru
  PUT    /api/kunjungan/:id/status  Update status (Dokter)
  DELETE /api/kunjungan/:id     Batalkan kunjungan (Pasien)

Rekam Medis
  GET    /api/rekam-medis       List rekam medis
  GET    /api/rekam-medis/saya  Rekam medis pasien sendiri
  GET    /api/rekam-medis/:id   Detail (IDOR protected)
  POST   /api/rekam-medis       Input rekam medis (Dokter)

Obat & Audit
  GET    /api/obat              Daftar obat
  POST   /api/obat              Tambah obat
  GET    /api/audit-log         Audit log (Admin only)
  GET    /health                Health check
```

---

## 📋 UTS Documentation

Proyek ini adalah bagian dari UTS mata kuliah **Secure Software Development Lifecycle (DevSecOps)** di Universitas Muhammadiyah Makassar.

| Dokumen | Deskripsi |
|---------|-----------|
| [`docs/docx/PRD.docx`](docs/docx/PRD.docx) | Product Requirements Document |
| [`docs/docx/UTS-LAPORAN-LENGKAP.docx`](docs/docx/UTS-LAPORAN-LENGKAP.docx) | Laporan UTS (BAB I–IX) |
| [`docs/docx/SAST-REPORT.docx`](docs/docx/SAST-REPORT.docx) | Laporan SAST |
| [`docs/docx/SCA-REPORT.docx`](docs/docx/SCA-REPORT.docx) | Laporan SCA |

---

## 👥 Tim Pengembang

<div align="center">

| Nama | NIM | Role |
|------|-----|------|
| Ashabul Kahfi | 105841100121 | Full-Stack Developer |
| [Anggota 2] | [NIM] | Security & Documentation |
| [Anggota 3] | [NIM] | UI/UX & Frontend |
| [Anggota 4] | [NIM] | DevOps & Deployment |

**Universitas Muhammadiyah Makassar**  
Fakultas Teknik — Program Studi Informatika  
Semester VI · Tahun Ajaran 2025-2026

</div>

---

<div align="center">

**MedCampus** — Secure Software Development Lifecycle · DevSecOps

[![Live](https://img.shields.io/badge/🌐-medcampus.duckdns.org-0066CC?style=for-the-badge)](https://medcampus.duckdns.org)
[![GitHub](https://img.shields.io/badge/GitHub-Kahfi10%2Fmedcampus-181717?style=for-the-badge&logo=github)](https://github.com/Kahfi10/medcampus)

*Built with ❤️ and strict security standards*

</div>
