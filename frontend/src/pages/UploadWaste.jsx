
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageUpload from "../components/ImageUpload";
import LoadingSpinner from "../components/LoadingSpinner";
import { submitQuestionnaire } from "../services/wasteService";
import { getErrorMessage } from "../utils/format";

const deviceQuestions = {
  mobile_phone: {
    label: "Mobile Phone",
    power: "Does the mobile phone switch on?",
    condition: "How is the phone functioning?",
    damage: "What physical damage does the phone have?",
    damages: ["no_damage", "cracked_screen", "damaged_body", "other_damage"],
    damageLabels: ["No damage", "Cracked screen", "Damaged body", "Other damage"],
  },
  laptop: {
    label: "Laptop",
    power: "Does the laptop power on?",
    condition: "How is the laptop functioning?",
    damage: "What physical damage is visible?",
    damages: ["no_damage", "cracked_screen", "damaged_body", "other_damage"],
    damageLabels: ["No damage", "Cracked display", "Damaged body", "Other damage"],
  },
  tablet: {
    label: "Tablet",
    power: "Does the tablet switch on?",
    condition: "How is the tablet functioning?",
    damage: "What physical damage is visible?",
    damages: ["no_damage", "cracked_screen", "damaged_body", "other_damage"],
    damageLabels: ["No damage", "Cracked screen", "Damaged body", "Other damage"],
  },
  desktop: {
    label: "Desktop Computer",
    power: "Does the computer power on?",
    condition: "How is the computer functioning?",
    damage: "What physical damage is visible?",
    damages: ["no_damage", "damaged_body", "other_damage"],
    damageLabels: ["No damage", "Damaged cabinet", "Other damage"],
  },
  motherboard: {
    label: "Motherboard",
    power: "Does the motherboard power on when tested?",
    condition: "What is the motherboard's working condition?",
    damage: "Are there any visible PCB or component damages?",
    damages: ["no_damage", "damaged_body", "other_damage"],
    damageLabels: ["No visible damage", "Damaged PCB or components", "Burn marks or corrosion"],
  },
  monitor: {
    label: "Monitor",
    power: "Does the monitor turn on?",
    condition: "How is the monitor functioning?",
    damage: "What physical damage is visible?",
    damages: ["no_damage", "cracked_screen", "damaged_body", "other_damage"],
    damageLabels: ["No damage", "Cracked display", "Damaged body", "Other damage"],
  },
  keyboard: {
    label: "Keyboard",
    power: "Does the keyboard connect and respond?",
    condition: "How well do the keys and connections work?",
    damage: "What physical damage is visible?",
    damages: ["no_damage", "damaged_body", "other_damage"],
    damageLabels: ["No damage", "Broken keys or body", "Liquid or other damage"],
  },
  mouse: {
    label: "Mouse",
    power: "Does the mouse connect and respond?",
    condition: "How well do the buttons and scroll wheel work?",
    damage: "What physical damage is visible?",
    damages: ["no_damage", "damaged_body", "other_damage"],
    damageLabels: ["No damage", "Damaged body or buttons", "Other damage"],
  },
  battery: {
    label: "Battery",
    power: "Does the battery function normally?",
    condition: "What is the battery's condition?",
    damage: "Is there any visible swelling, leakage or damage?",
    damages: ["no_damage", "damaged_body", "other_damage"],
    damageLabels: ["No visible damage", "Swollen or physically damaged", "Leakage or other damage"],
  },
  charger: {
    label: "Charger / Adapter",
    power: "Does the charger provide power?",
    condition: "How is the charger functioning?",
    damage: "What physical damage is visible?",
    damages: ["no_damage", "damaged_body", "other_damage"],
    damageLabels: ["No damage", "Damaged casing or pins", "Burn marks or other damage"],
  },
  cables: {
    label: "Electronic Cables",
    power: "Does the cable transmit power or data?",
    condition: "What is the cable's condition?",
    damage: "Is the cable cut, exposed or damaged?",
    damages: ["no_damage", "damaged_body", "other_damage"],
    damageLabels: ["No damage", "Cut or exposed wires", "Other damage"],
  },
  circuit_board: {
    label: "Circuit Board",
    power: "Does the circuit board function when tested?",
    condition: "What is the circuit board's working condition?",
    damage: "Are there visible component or circuit damages?",
    damages: ["no_damage", "damaged_body", "other_damage"],
    damageLabels: ["No visible damage", "Damaged components", "Burn marks or corrosion"],
  },
  other: {
    label: "Other Electronic Device",
    power: "Does the device function or power on?",
    condition: "What is its overall working condition?",
    damage: "What physical damage is visible?",
    damages: ["no_damage", "cracked_screen", "damaged_body", "other_damage"],
    damageLabels: ["No damage", "Cracked screen", "Damaged body", "Other damage"],
  },
};

const conditionOptions = [
  { value: "working_perfectly", label: "Working perfectly" },
  { value: "minor_issues", label: "Minor issues" },
  { value: "major_damage", label: "Major damage" },
  { value: "not_working", label: "Not working" },
];

export default function UploadWaste() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [deviceType, setDeviceType] = useState("");
  const [answers, setAnswers] = useState({});
  const [showQuestions, setShowQuestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedDevice = deviceQuestions[deviceType];

  const updateAnswer = (key, value) => {
    setAnswers((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const startQuestionnaire = () => {
    if (!deviceType) {
      setError("Please select your electronic device.");
      return;
    }

    setError("");
    setAnswers({});
    setShowQuestions(true);
  };

  const submit = async () => {
    const required = [
      "powersOn",
      "condition",
      "physicalDamage",
      "preference",
    ];

    if (required.some((key) => !answers[key])) {
      setError("Please answer all questions.");
      return;
    }

    if (
      deviceType === "battery" &&
      answers.physicalDamage !== "no_damage"
    ) {
      setError(
        "Damaged, swollen or leaking batteries must be handled by an authorized battery recycling professional. Do not reuse or handle them yourself."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        deviceType,
        powersOn: answers.powersOn,
        condition: answers.condition,
        physicalDamage: answers.physicalDamage,
        preference: answers.preference,
      };

      const result = await submitQuestionnaire(payload, file);

      navigate(`/analysis/${result.id}`, {
        state: {
          decision: result.recommendation,
          reason: result.reason,
          analysis: {
            ...result,
            id: result.id,
            component: selectedDevice.label,
            reusability: result.recommendation,
            suggestion: result.reason,
          },
        },
      });
    } catch (e) {
      setError(getErrorMessage(e));
      setLoading(false);
    }
  };

  return (
    <div className="container narrow">
      {loading && (
        <LoadingSpinner
          overlay
          text="Evaluating your electronic waste..."
        />
      )}

      <div className="center-head">
        <h1>Upload E-Waste</h1>
        <p className="muted">
          Upload an electronic waste image, select its category and answer
          the relevant questions to get a reuse or recycle decision.
        </p>
      </div>

      <div className="card upload-card">
        <ImageUpload
          file={file}
          onChange={(selectedFile) => {
            setFile(selectedFile);
            setDeviceType("");
            setAnswers({});
            setShowQuestions(false);
            setError("");
          }}
          disabled={loading}
        />

        {file && (
          <div className="form-group">
            <label>
              <strong>Select Electronic Device</strong>
            </label>

            <select
              className="form-control"
              value={deviceType}
              onChange={(e) => {
                setDeviceType(e.target.value);
                setAnswers({});
                setShowQuestions(false);
                setError("");
              }}
              disabled={loading}
            >
              <option value="">Choose device category</option>
              {Object.entries(deviceQuestions).map(([value, device]) => (
                <option key={value} value={value}>
                  {device.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {file && !showQuestions && (
          <button
            className="btn btn-primary btn-block"
            disabled={!deviceType || loading}
            onClick={startQuestionnaire}
          >
            Continue to Questionnaire
          </button>
        )}

        {showQuestions && selectedDevice && (
          <div className="questionnaire">
            <h2>{selectedDevice.label} Assessment</h2>
            <p className="muted">
              Answer these questions about your selected electronic device.
            </p>

            <div className="form-group">
              <label><strong>1. {selectedDevice.power}</strong></label>
              <select
                className="form-control"
                value={answers.powersOn || ""}
                onChange={(e) => updateAnswer("powersOn", e.target.value)}
                disabled={loading}
              >
                <option value="">Select an answer</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="not_sure">Not sure</option>
              </select>
            </div>

            <div className="form-group">
              <label><strong>2. {selectedDevice.condition}</strong></label>
              <select
                className="form-control"
                value={answers.condition || ""}
                onChange={(e) => updateAnswer("condition", e.target.value)}
                disabled={loading}
              >
                <option value="">Select an answer</option>
                {conditionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label><strong>3. {selectedDevice.damage}</strong></label>
              <select
                className="form-control"
                value={answers.physicalDamage || ""}
                onChange={(e) =>
                  updateAnswer("physicalDamage", e.target.value)
                }
                disabled={loading}
              >
                <option value="">Select an answer</option>
                {selectedDevice.damages.map((value, index) => (
                  <option key={value} value={value}>
                    {selectedDevice.damageLabels[index]}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label><strong>4. What would you prefer?</strong></label>
              <select
                className="form-control"
                value={answers.preference || ""}
                onChange={(e) => updateAnswer("preference", e.target.value)}
                disabled={loading}
              >
                <option value="">Select your preference</option>
                <option value="reuse">Reuse / Repair</option>
                <option value="recycle">Recycle</option>
              </select>
            </div>

            <button
              className="btn btn-primary btn-block"
              disabled={loading}
              onClick={submit}
            >
              Submit and Get Decision
            </button>
          </div>
        )}

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
