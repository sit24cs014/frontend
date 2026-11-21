import { Cpu, Gauge, IndianRupee, Wrench, Leaf } from "lucide-react";
import { formatPrice, formatCo2 } from "../utils/format";

export default function AnalysisCards({ analysis: a }) {
  const co2 = formatCo2(a.co2);
  const cards = [
    { icon: Cpu, label: "Detected Component", value: a.component },
    { icon: Gauge, label: "Reusability Level", value: <span className={`badge reuse-${a.reusability.toLowerCase()}`}>{a.reusability}</span> },
    { icon: IndianRupee, label: "Estimated Price", value: formatPrice(a.priceMin, a.priceMax, a.priceRaw) },
    { icon: Wrench, label: "Repair Suggestion", value: a.suggestion || "No suggestion available for this item." },
    {
      icon: Leaf,
      label: "Environmental Impact",
      value: co2 ? `You helped save approximately ${co2} of CO₂ emissions.` : "Impact estimate not available for this item.",
    },
  ];
  return (
    <div className="result-grid">
      {cards.map(({ icon: Icon, label, value }) => (
        <div className="result-card" key={label}>
          <div className="result-head"><span className="mini-icon"><Icon size={18} /></span><p>{label}</p></div>
          <div className="result-value">{value}</div>
        </div>
      ))}
    </div>
  );
}
