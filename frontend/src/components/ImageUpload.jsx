import { useEffect, useRef, useState } from "react";
import { Upload, X, RefreshCw } from "lucide-react";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX = 10 * 1024 * 1024;

export default function ImageUpload({ file, onChange, disabled }) {
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!file) return setPreview("");
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f) => {
    if (!f) return;
    if (!TYPES.includes(f.type)) return setError("Unsupported file type. Please upload a JPG, PNG or WEBP image.");
    if (f.size > MAX) return setError("File is too large. The maximum size is 10MB.");
    setError("");
    onChange(f);
  };

  const open = () => !disabled && inputRef.current?.click();

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          pick(e.target.files[0]);
          e.target.value = "";
        }}
      />

      {!file ? (
        <div
          className={`dropzone ${drag ? "drag" : ""}`}
          role="button"
          tabIndex={0}
          onClick={open}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && open()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); if (!disabled) pick(e.dataTransfer.files[0]); }}
        >
          <div className="drop-icon"><Upload size={30} /></div>
          <p className="drop-title">Click to upload or drag &amp; drop</p>
          <p className="drop-sub">JPG, PNG, WEBP up to 10MB</p>
        </div>
      ) : (
        <div className="preview">
          <img src={preview} alt="Selected e-waste preview" />
          <div className="preview-actions">
            <button type="button" className="btn btn-light" onClick={open} disabled={disabled}><RefreshCw size={16} /> Replace</button>
            <button type="button" className="btn btn-light danger" onClick={() => onChange(null)} disabled={disabled}><X size={16} /> Remove</button>
          </div>
          <p className="file-meta">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}
