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
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/Express.js-4-000000?style=flat-square&logo=express&logoColor=white"/>
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white"/>
  <img src="https://img.shields.io/badge/MySQL-Database-4479A1?style=flat-square&logo=mysql&logoColor=white"/>
  <img src="https://img.shields.io/badge/GSAP-Animations-88CE02?style=flat-square&logo=greensock&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeScript-Language-3178C6?style=flat-square&logo=typescript&logoColor=white"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OWASP_Top_10-Compliant-30B86A?style=flat-square"/>
  <img src="https://img.shields.io/badge/STRIDE-Threat_Modeled-FF9F0A?style=flat-square"/>
  <img src="https://img.shields.io/badge/SAST-Verified-5856D6?style=flat-square"/>
  <img src="https://img.shields.io/badge/SCA-Audited-FF3B30?style=flat-square"/>
  <img src="https://img.shields.io/badge/SSL-HTTPS_Only-30B86A?style=flat-square&logo=letsencrypt&logoColor=white"/>
</p>

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
               ┌────────▼────────┐
               │     DuckDNS     │
               │  DNS Resolution  │
               └────────┬────────┘
                        │
          ┌─────────────▼──────────────┐
          │     Oracle Cloud VM        │
          │     Ubuntu 22.04 ARM       │
          │                            │
          │   ┌─────────────────────┐  │
          │   │  Nginx  (SSL/HTTPS) │  │
          │   └──────┬──────────┬───┘  │
          │          │          │       │
          │       Client      API       │
          │          │          │       │
          │   ┌──────▼──┐  ┌───▼────┐  │
          │   │ Next.js  │  │Express │  │
          │   │  (PM2)   │  │ (PM2)  │  │
          │   └──────────┘  └───┬────┘  │
          │                     │        │
          │              ┌──────▼──────┐ │
          │              │    MySQL    │ │
          │              │ (internal)  │ │
          │              └─────────────┘ │
          └────────────────────────────┘
```

---

## 🚀 Fitur Utama

### 👥 Multi-Role System
| Role | Kemampuan |
|------|-----------|
| 🔴 **Admin** | Kelola pengguna, data obat, kunjungan, dan audit log |
| 🟢 **Dokter** | Input rekam medis, kelola antrian, resep obat |
| 🔵 **Pasien** | Daftar kunjungan, lihat rekam medis milik sendiri |

### 🔐 Keamanan
- ✅ **Broken Access Control** — IDOR protection dengan ownership verification
- ✅ **Cryptographic Failures** — Password hashing dengan algoritma modern
- ✅ **Injection** — Parameterized query via ORM, tidak ada raw SQL
- ✅ **Auth Failures** — Rate limiting dan brute force protection
- ✅ **Security Misconfiguration** — Security headers dan konfigurasi aman
- ✅ **Logging & Monitoring** — Audit trail untuk semua aktivitas sensitif

### 🎨 UI/UX Premium
- **GSAP Animations** — ScrollTrigger, word reveal, counter animations
- **shadcn/ui** — Komponen UI dengan Apple design tokens
- **Apple-Inspired** — Color palette, typography, dan spacing dari apple.com
- **Mobile Responsive** — Sidebar drawer, hamburger menu, adaptive layout
- **Toast Notifications** — Real-time feedback yang elegan
- **Skeleton Loading** — Loading state yang halus

---

## 🛡️ Security Architecture

### Threat Modeling — STRIDE
Seluruh ancaman diidentifikasi dan dimitigasi menggunakan metode STRIDE:

| Kategori | Mitigasi |
|----------|---------|
| Spoofing | Password hashing + multi-factor auth protection |
| Tampering | ORM parameterized query + input validation |
| Repudiation | Comprehensive audit trail logging |
| Information Disclosure | Generic error responses + IDOR protection |
| Denial of Service | Request rate limiting + input size controls |
| Elevation of Privilege | RBAC middleware pada setiap endpoint |

### Security Testing
- **SAST** — Static code analysis menggunakan ESLint Security Plugin. Seluruh temuan telah diverifikasi dan diperbaiki sebelum deployment.
- **SCA** — Dependency audit menggunakan `npm audit`. Dependency rentan dihapus atau diupgrade. Risk acceptance didokumentasikan untuk dependency dev-only.

---

## 📦 Tech Stack

### Frontend
| Teknologi | Fungsi |
|-----------|--------|
| Next.js 14 | React framework (App Router) |
| TypeScript | Type safety |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Accessible component library |
| GSAP | Professional animations |

### Backend
| Teknologi | Fungsi |
|-----------|--------|
| Express.js | REST API framework |
| TypeScript | Type safety |
| Prisma ORM | Database access layer |
| bcryptjs | Password hashing |
| jsonwebtoken | Authentication tokens |
| helmet | Security HTTP headers |
| express-rate-limit | Brute force protection |
| express-validator | Input validation & sanitization |

### Infrastructure
| Teknologi | Fungsi |
|-----------|--------|
| Oracle Cloud ARM | Cloud VM |
| PM2 | Process manager (cluster mode) |
| Nginx | Reverse proxy + SSL termination |
| Let's Encrypt | SSL certificate |
| DuckDNS | Dynamic DNS |
| MySQL | Relational database |

---

## 📁 Struktur Project

```
medcampus/
├── apps/
│   ├── client/          # Next.js Frontend
│   │   ├── app/
│   │   │   ├── (auth)/          # Login, Register
│   │   │   └── (dashboard)/     # Dashboard per role
│   │   ├── components/
│   │   │   ├── dashboard/       # Dashboard components
│   │   │   ├── sections/        # Landing page sections
│   │   │   └── ui/              # UI components
│   │   └── lib/
│   │       ├── auth.ts          # Auth utilities
│   │       └── gsap.ts          # Animation helpers
│   │
│   └── server/          # Express.js Backend
│       ├── src/
│       │   ├── controllers/     # Business logic
│       │   ├── middleware/      # Auth, RBAC, Error handler
│       │   ├── routes/          # API endpoints
│       │   └── utils/           # Prisma, Audit logger
│       └── prisma/
│           ├── schema.prisma    # Database schema
│           └── seed.ts          # Initial data
│
├── packages/shared/     # Shared TypeScript types
├── docs/docx/           # UTS Documentation (Word)
└── PRD.md               # Product Requirements Document
```

---

## 🗄️ Database Schema

```
User ──────────── Kunjungan ──────── RekamMedis
                      │                  │
                 StatusKunjungan         ├── ResepObat ── Obat
                 ┌────────────┐          │
                 │ MENUNGGU   │       AuditLog
                 │ DIPROSES   │
                 │ SELESAI    │
                 │ DIBATALKAN │
                 └────────────┘
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
# Server — salin template dan isi kredensial
cp apps/server/.env.example apps/server/.env

# Client
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > apps/client/.env.local
```

### 3. Database & Run
```bash
cd apps/server
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
npm run dev

# Terminal baru
cd apps/client && npm run dev
```

Buka: **http://localhost:3000**

---

## 🌐 API Overview

```
POST  /api/auth/register    Registrasi pasien baru
POST  /api/auth/login       Login (dilindungi rate limiting)
POST  /api/auth/logout      Logout & invalidasi sesi
GET   /api/auth/me          Profil pengguna aktif

GET   /api/kunjungan        Daftar kunjungan
POST  /api/kunjungan        Buat kunjungan baru
PUT   /api/kunjungan/:id    Update status kunjungan

GET   /api/rekam-medis      Daftar rekam medis
POST  /api/rekam-medis      Input rekam medis baru
GET   /api/rekam-medis/:id  Detail rekam medis (IDOR protected)

GET   /api/obat             Daftar obat
GET   /api/audit-log        Log aktivitas (Admin only)
GET   /health               Status server & database
```

> Seluruh endpoint (kecuali register, login, health) memerlukan autentikasi.
> Akses dikontrol berdasarkan role pengguna.

---

## 📋 UTS Documentation

Proyek ini adalah bagian dari UTS mata kuliah **Secure Software Development Lifecycle (DevSecOps)** — Universitas Muhammadiyah Makassar.

| Dokumen | Deskripsi |
|---------|-----------|
| [`PRD.docx`](docs/docx/PRD.docx) | Product Requirements Document |
| [`UTS-LAPORAN-LENGKAP.docx`](docs/docx/UTS-LAPORAN-LENGKAP.docx) | Laporan UTS (BAB I–IX) |
| [`SAST-REPORT.docx`](docs/docx/SAST-REPORT.docx) | Static Application Security Testing |
| [`SCA-REPORT.docx`](docs/docx/SCA-REPORT.docx) | Software Composition Analysis |

---

## 👥 Tim Pengembang

<div align="center">

| Nama | NIM | Role |
|------|-----|------|
| Ashabul Kahfi | 105841100121 | Full-Stack Developer |
| Marhepi Rahmadani | 105841109523 | Security & Documentation |
| Afra Muawiya | 105841108423 | UI/UX & Frontend |
| Alyah Saputri Bakri | 105841107723 | DevOps & Deployment |

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
