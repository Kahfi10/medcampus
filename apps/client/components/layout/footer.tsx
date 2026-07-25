import Link from "next/link";

const FOOTER_LINKS = [
  {
    heading: "Sistem",
    links: [
      { label: "Fitur", href: "#fitur" },
      { label: "Keamanan", href: "#keamanan" },
      { label: "Statistik", href: "#statistik" },
    ],
  },
  {
    heading: "Akun",
    links: [
      { label: "Masuk", href: "/login" },
      { label: "Daftar Pasien", href: "/register" },
    ],
  },
  {
    heading: "Teknologi",
    links: [
      { label: "Next.js 14", href: "#" },
      { label: "Express.js", href: "#" },
      { label: "PostgreSQL", href: "#" },
      { label: "Prisma ORM", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#1D1D1F] text-white">
      <div className="content-wide py-16">
        {/* Top */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-8 h-8 rounded-lg bg-[#0066CC] flex items-center justify-center group-hover:bg-[#0077ED] transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 2v12M2 8h12"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="font-bold text-[17px] tracking-tight">
                MedCampus
              </span>
            </Link>
            <p className="text-[14px] text-white/50 leading-relaxed max-w-[200px]">
              Sistem rekam medis klinik kampus dengan standar keamanan DevSecOps.
            </p>
            <div className="flex gap-2 mt-5">
              {["SAST", "SCA", "OWASP"].map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-semibold text-white/40 border border-white/10 rounded-full px-2.5 py-0.5"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <h4 className="text-[13px] font-semibold text-white/40 uppercase tracking-widest mb-4">
                {group.heading}
              </h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[15px] text-white/70 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-white/30">
            © 2026 MedCampus — Universitas Muhammadiyah Makassar
          </p>
          <p className="text-[13px] text-white/30">
            Secure Software Development Lifecycle · DevSecOps
          </p>
        </div>
      </div>
    </footer>
  );
}
