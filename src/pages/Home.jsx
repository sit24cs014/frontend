import { IndianRupee, Leaf, Truck, Sparkles } from "lucide-react";
import HeroSection from "../components/HeroSection";
import FeatureCard from "../components/FeatureCard";
import HowItWorks from "../components/HowItWorks";

const features = [
  { icon: IndianRupee, title: "Earn Money", description: "Get fair estimated prices for your electronic waste based on intelligent analysis." },
  { icon: Leaf, title: "Save the Planet", description: "Reduce electronic pollution and prevent harmful waste from entering landfills." },
  { icon: Truck, title: "Easy Pickup", description: "Schedule a convenient doorstep pickup for your electronic waste." },
  { icon: Sparkles, title: "Earn Rewards", description: "Earn Eco Points through responsible recycling and redeem available rewards." },
];

export default function Home() {
  return (
    <>
      <HeroSection />
      <section className="section section-alt">
        <h2 className="section-title">Why Choose E:Revive?</h2>
        <p className="section-sub">Smart, sustainable, and rewarding e-waste management powered by Machine Learning.</p>
        <div className="feature-grid">
          {features.map((f) => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>
      <HowItWorks />
    </>
  );
}
