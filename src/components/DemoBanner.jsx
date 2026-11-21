import { useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";

export default function DemoBanner() {
  const [demo, setDemo] = useState(sessionStorage.getItem("erevive_demo") === "1");

  useEffect(() => {
    const on = () => setDemo(true);
    window.addEventListener("erevive-demo", on);
    return () => window.removeEventListener("erevive-demo", on);
  }, []);

  if (!demo) return null;
  return (
    <div className="demo-banner" role="status">
      <FlaskConical size={16} />
      <span>
        <strong>Demo mode:</strong> the backend could not be reached. Data is stored in this browser only and results are
        not real Machine Learning predictions.
      </span>
    </div>
  );
}
