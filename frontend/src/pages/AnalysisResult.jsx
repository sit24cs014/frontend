
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  IndianRupee,
  Leaf,
  Weight,
  PackageCheck,
  Recycle,
} from "lucide-react";
import AnalysisCards from "../components/AnalysisCards";
import LoadingSpinner from "../components/LoadingSpinner";
import { getAnalysis } from "../services/wasteService";
import { getErrorMessage } from "../utils/format";

export default function AnalysisResult() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState(state?.analysis || null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (analysis) return;

    getAnalysis(id)
      .then(setAnalysis)
      .catch((e) => setError(getErrorMessage(e)));
  }, [id, analysis]);

  if (error) {
    return (
      <div className="container narrow">
        <div className="alert alert-error">{error}</div>
        <button
          className="btn btn-outline"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="container">
        <LoadingSpinner text="Loading assessment..." />
      </div>
    );
  }

  const image = analysis.image || state?.preview;

  const recommendation =
    analysis.recommendation ||
    analysis.reusability ||
    state?.decision;

  const isReuse = recommendation === "REUSE";

  const money = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    });

  const materials = analysis.recoverableMaterials || [];

  return (
    <div className="container narrow">
      <div className="center-head">
        <h1>Analysis Results</h1>
        <p className="muted">
          Electronic waste assessment and environmental impact report.
        </p>
      </div>

      {image && (
        <div className="result-image">
          <img src={image} alt="Uploaded electronic waste" />
        </div>
      )}

      {/* DEVICE AND DECISION */}

      <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
        <h2>
          {analysis.component ||
            analysis.deviceIdentified ||
            "Electronic Device"}
        </h2>

        <div
          style={{
            padding: "16px",
            borderRadius: "10px",
            marginTop: "15px",
            background: isReuse ? "#e8f7ed" : "#fff3e0",
            color: isReuse ? "#176b35" : "#9a5700",
          }}
        >
          <h2 style={{ margin: 0 }}>
            {recommendation || "ASSESSMENT PENDING"}
          </h2>

          <p style={{ marginBottom: 0 }}>
            {analysis.reason ||
              analysis.suggestion ||
              "Professional inspection is recommended."}
          </p>
        </div>
      </div>

      {/* EXISTING ANALYSIS INFORMATION */}

      <AnalysisCards analysis={analysis} />

      {/* ESTIMATED VALUE */}

      <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <IndianRupee size={26} />
          <h2 style={{ margin: 0 }}>Estimated Economic Value</h2>
        </div>

        <h1 style={{ marginTop: "18px" }}>
          ₹{money(analysis.estimatedValueMin)} – ₹
          {money(analysis.estimatedValueMax)}
        </h1>

        <strong>
          {analysis.valueType || "Estimated device value"}
        </strong>

        <p className="muted">
          Approximate resale or recycling value based on device category and
          reported condition. Actual value may change after physical
          inspection and market evaluation.
        </p>
      </div>

      {/* ENVIRONMENTAL IMPACT */}

      <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Leaf size={26} />
          <h2 style={{ margin: 0 }}>Environmental Impact</h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "14px",
            marginTop: "20px",
          }}
        >
          <div
            className="card"
            style={{ padding: "16px", textAlign: "center" }}
          >
            <Leaf size={26} />
            <h2>{analysis.co2SavedKg ?? "N/A"} kg</h2>
            <strong>CO₂ Impact</strong>
            <p className="muted">Estimated emissions avoided</p>
          </div>

          <div
            className="card"
            style={{ padding: "16px", textAlign: "center" }}
          >
            <Weight size={26} />
            <h2>{analysis.wasteDivertedKg ?? "N/A"} kg</h2>
            <strong>E-Waste Diverted</strong>
            <p className="muted">Estimated device weight</p>
          </div>
        </div>

        <p className="muted" style={{ marginTop: "15px" }}>
          Environmental figures are indicative estimates based on typical
          device weights and category-level assumptions. They are not
          certified carbon footprint measurements.
        </p>
      </div>

      {/* RECOVERABLE MATERIALS */}

      <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <PackageCheck size={26} />
          <h2 style={{ margin: 0 }}>Recoverable Materials</h2>
        </div>

        {materials.length > 0 ? (
          <ul style={{ marginTop: "16px", paddingLeft: "22px" }}>
            {materials.map((material, index) => (
              <li key={index} style={{ marginBottom: "8px" }}>
                {material}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">
            Material recovery information will be available after assessment.
          </p>
        )}
      </div>

      {/* NEXT ACTION */}

      <div className="result-actions">
        <button
          className="btn btn-primary btn-block"
          onClick={() =>
            navigate("/schedule-pickup", {
              state: {
                analysisId: analysis.id || analysis.surveyId,
                deviceType: analysis.deviceType,
              },
            })
          }
        >
          <Recycle size={17} style={{ verticalAlign: "middle" }} />
          {isReuse
            ? "Proceed to Reuse Pickup"
            : "Proceed to Recycling Pickup"}
        </button>

        <button
          className="btn btn-outline btn-block"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
