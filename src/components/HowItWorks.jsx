import { Upload, Cpu, Truck } from "lucide-react";

const steps = [
  { icon: Upload, title: "Upload Photo", text: "Upload a clear image of your electronic waste." },
  { icon: Cpu, title: "ML Analysis", text: "Our Machine Learning model identifies the electronic component and estimates its value and reusability." },
  { icon: Truck, title: "Schedule Pickup", text: "Choose a convenient date and time for doorstep collection." },
];

export default function HowItWorks() {
  return (
    <section className="section">
      <h2 className="section-title">How It Works</h2>
      <div className="steps">
        {steps.map(({ icon: Icon, title, text }, i) => (
          <div className="step" key={title}>
            <div className="step-circle">
              <Icon size={30} />
              <span className="step-num">{i + 1}</span>
            </div>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
