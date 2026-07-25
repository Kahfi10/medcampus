import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import HeroSection from "@/components/sections/hero-section";
import FeaturesSection from "@/components/sections/features-section";
import SecuritySection from "@/components/sections/security-section";
import StatsSection from "@/components/sections/stats-section";
import CTASection from "@/components/sections/cta-section";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <SecuritySection />
      <StatsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
