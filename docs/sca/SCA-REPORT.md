# BAB VI — Software Composition Analysis (SCA)
# MedCampus — Laporan Pengujian Keamanan Dependency

**Tools:** npm audit (built-in Node.js Package Manager)
**Tanggal Scan:** Juli 2026
**Scope:** apps/client (Next.js) + apps/server (Express.js)

---

## Hasil Scan SEBELUM Perbaikan

### Server (apps/server) — 4 HIGH vulnerabilities

| ID | Dependency | Versi | CVE | Severity | Deskripsi |
|----|-----------|-------|-----|----------|-----------|
| SCA-S01 | `yamljs` | >=0.2.8 | GHSA-mh99-v99m-4gvg | HIGH | brace-expansion DoS via unbounded expansion |
| SCA-S02 | `glob` | 4.3.0-10.5.0 | (via minimatch) | HIGH | minimatch ReDoS via brace-expansion |
| SCA-S03 | `minimatch` | 2.0.0-10.0.2 | (via brace-expansion) | HIGH | brace-expansion out-of-memory crash |
| SCA-S04 | `brace-expansion` | <=5.0.7 | GHSA-mh99-v99m-4gvg | HIGH | DoS via unbounded expansion length |

**Root cause:** `yamljs` package (dipasang untuk Swagger) tidak pernah digunakan
di source code, namun memiliki dependency chain ke versi `glob` yang rentan.

### Client (apps/client) — 16 HIGH + 0 CRITICAL vulnerabilities

| ID | Dependency | Versi | Severity | Kategori |
|----|-----------|-------|----------|---------|
| SCA-C01 | `next` | 14.2.15 | HIGH | Multiple CVE (lihat detail) |
| SCA-C02 | `postcss` | <=8.5.17 | HIGH | XSS via CSS Stringify |
| SCA-C03 | `brace-expansion` | <=5.0.7 | HIGH | DoS (via eslint) |
| SCA-C04 | `minimatch` | 2.0.0-10.0.2 | HIGH | ReDoS (via eslint) |
| SCA-C05 | `eslint` | 4.1.0-10.0.0 | HIGH | Depends on vulnerable deps |
| SCA-C06-C16 | eslint-* plugins | various | HIGH | Transitive deps dari eslint |

**Detail CVE Next.js (SCA-C01):**
- GHSA-7m27-7ghc-44w9: DoS via Server Actions
- GHSA-5j59-xgg2-r9c4: DoS via Server Components
- GHSA-f82v-jwr5-mffw: Authorization Bypass via Middleware
- GHSA-ggv3-7p47-pfv8: HTTP request smuggling in rewrites
- (+ 26 CVE lainnya)

---

## Tindakan Perbaikan

### Fix 1 — Hapus `yamljs` (Server) — BERHASIL

**Alasan:** `yamljs` tidak digunakan di source code sama sekali (MED-11 dari audit
internal). Package diinstall sebagai bagian dari rencana Swagger yang belum
diimplementasi.

**Tindakan:**
```bash
# Hapus dari package.json server
npm install  # re-install tanpa yamljs
```

**Hasil:** 4 HIGH vulnerabilities server **tereliminasi**.

### Fix 2 — Upgrade Next.js 14.2.15 → 14.2.35 (Client) — PARTIAL

**Tindakan:**
```bash
npm install next@14.2.35 --workspace=apps/client
```

**Hasil:** Next.js berhasil diupgrade ke latest patch 14.2.x.
CVE yang resolved: GHSA-h64f-5h5j-jqjh (DoS via Image Optimization), beberapa
DoS lainnya yang telah dipatch di 14.2.x.

---

## Hasil Scan SETELAH Perbaikan

### Server (apps/server)

```
found 0 vulnerabilities ✓
```

**Perbandingan:** 4 HIGH → 0 vulnerabilities (100% resolved)

### Client (apps/client)

```
16 high severity vulnerabilities (tidak berubah)
```

---

## Analisis Risk Acceptance

### Kelompok 1 — eslint Chain (SCA-C03 s/d SCA-C16) — FALSE POSITIVE PRODUCTION

**Analisis:**
- Package: `eslint`, `eslint-config-next`, `eslint-plugin-*`, `brace-expansion`, `minimatch`, `glob`
- Semua package ini ada di `devDependencies`
- **Tidak diinclude dalam production build** (`next build` tidak membundle eslint)
- Tidak dijalankan di server produksi
- Hanya digunakan saat development (`npm run lint`)

**Keputusan:** **Risk Acceptance**

**Justifikasi:**
1. Tidak ada exposure ke production environment
2. Attacker tidak dapat mengeksploitasi eslint di production
3. Fix membutuhkan downgrade eslint ke v4 (breaking change besar)
4. Tindakan sementara: jangan expose environment development ke internet

**Batas evaluasi:** Saat upgrade Next.js ke v15+ di masa mendatang, eslint chain
akan ikut terupdate secara otomatis.

---

### Kelompok 2 — Next.js CVEs (SCA-C01) — PARTIAL FALSE POSITIVE

**Analisis per CVE:**

| CVE | Kondisi Eksploitasi | Applicable? | Status |
|-----|-------------------|-------------|--------|
| GHSA-7m27-7ghc-44w9 (DoS via Server Actions) | Memerlukan Server Actions diaktifkan | **Tidak** — kami tidak pakai Server Actions | False Positive |
| GHSA-f82v-jwr5-mffw (Auth Bypass Middleware) | Memerlukan custom Middleware | **Tidak** — kami tidak pakai Middleware | False Positive |
| GHSA-ggv3-7p47-pfv8 (HTTP Smuggling in Rewrites) | Memerlukan `rewrites` config | **Tidak** — tidak ada rewrites config | False Positive |
| GHSA-36qx-fr4f-26g5 (i18n Middleware Bypass) | Memerlukan i18n konfigurasi | **Tidak** — tidak ada i18n | False Positive |
| GHSA-5j59-xgg2-r9c4 (DoS Server Components) | Server Components tanpa error boundary | **Partially** — ada potensi | Risk Acceptance |
| GHSA-mwv6-3258-q52c (DoS Server Components) | Kondisi khusus rendering | **Rendah** | Risk Acceptance |

**Keputusan:** **Risk Acceptance** untuk Next.js CVEs

**Justifikasi:**
1. Mayoritas CVE tidak applicable karena kami tidak menggunakan fitur yang rentan
   (Server Actions, Middleware, i18n, rewrites)
2. CVE yang potentially applicable (DoS Server Components) hanya terjadi pada
   kondisi rendering spesifik yang tidak kami miliki
3. Upgrade ke Next.js 15+ memerlukan migrasi signifikan dan testing ulang
   seluruh aplikasi
4. Aplikasi ini berjalan di environment non-publik (kampus, bukan internet terbuka)

**Kontrol keamanan sementara:**
- Aplikasi hanya berjalan di environment kampus (localhost / LAN)
- Nginx rate limiting 100 req/menit
- `next.config.js` tidak mengaktifkan fitur rentan

**Rencana perbaikan berikutnya:**
- Upgrade ke Next.js 15.x pada development cycle berikutnya
- Evaluasi ulang dalam 3 bulan (Oktober 2026)

**Pihak bertanggung jawab:** Tim Pengembang MedCampus

---

## Tabel Perbandingan

| Workspace | Before | After | Fixed | Risk Acceptance |
|-----------|--------|-------|-------|-----------------|
| apps/server | 4 HIGH | 0 | ✓ 4 HIGH (yamljs removed) | - |
| apps/client | 16 HIGH | 16 HIGH | 0 | 16 HIGH (15 dev-only, 1 partial FP) |
| **Total** | **20 HIGH** | **16 HIGH** | **4 fixed** | **16 accepted** |

---

## Lock File

Lock file (`package-lock.json`) disertakan di repository untuk memastikan
reproducible builds dan memudahkan audit dependency di masa mendatang.

**Versi dependency final setelah perbaikan:**
- `next`: 14.2.35 (upgraded dari 14.2.15)
- `yamljs`: REMOVED (dari server)
- `eslint`: 8.57.1
