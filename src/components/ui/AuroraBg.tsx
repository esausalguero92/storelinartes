/**
 * AuroraBg — fondo aurora CSS puro.
 * Blobs animados con filter:blur + transform keyframes (GPU-accelerated).
 * Usar dentro de un contenedor con position:relative y overflow:hidden.
 */
export default function AuroraBg() {
  return (
    <div aria-hidden="true" className="aurora-root">
      <div className="aurora-blob aurora-1" />
      <div className="aurora-blob aurora-2" />
      <div className="aurora-blob aurora-3" />
    </div>
  );
}
