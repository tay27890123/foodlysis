import HeroSection from "@/components/HeroSection";
import SectionNavCards from "@/components/SectionNavCards";
import MissionSection from "@/components/MissionSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background pt-16">
      <HeroSection />
      <SectionNavCards />
      <MissionSection />
      <FeaturesSection />
      <HowItWorksSection />
      <Footer />
    </div>
  );
};

export default Index;
