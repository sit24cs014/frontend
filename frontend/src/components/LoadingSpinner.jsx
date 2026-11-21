export default function LoadingSpinner({ text = "Loading...", overlay = false, size = 40 }) {
  const spinner = (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <div className="spinner" style={{ width: size, height: size }} />
      {text && <p>{text}</p>}
    </div>
  );
  return overlay ? <div className="spinner-overlay">{spinner}</div> : spinner;
}
