// Placeholder UPI QR code rendered as a self-contained SVG (no external
// requests, no extra dependencies). It is NOT a scannable code — it only
// mimics the look of a QR so the UPI flow can be wired up now.
//
// To use the real QR later, replace the <svg> below with the temple's actual
// UPI QR image, e.g.:
//   <img src={realUpiQrUrl} alt="UPI QR" className="h-44 w-44" />
// or generate one from a UPI intent string with a QR library.
export default function UpiQrCode({ size = 176 }) {
  const modules = 25;
  const quiet = 2;
  const total = modules + quiet * 2;
  const cell = size / total;

  const inFinderBox = (r, c) => {
    const box = (br, bc) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return box(0, 0) || box(0, modules - 7) || box(modules - 7, 0);
  };

  const finderFilled = (r, c) => {
    const rel = (br, bc) => {
      const rr = r - br;
      const cc = c - bc;
      const ring = rr === 0 || rr === 6 || cc === 0 || cc === 6;
      const center = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
      return ring || center;
    };
    if (r < 7 && c < 7) return rel(0, 0);
    if (r < 7 && c >= modules - 7) return rel(0, modules - 7);
    if (r >= modules - 7 && c < 7) return rel(modules - 7, 0);
    return false;
  };

  // Deterministic pseudo-random fill so the pattern is stable across renders.
  const dataFilled = (r, c) => {
    const x = Math.sin((r + 1) * 12.9898 + (c + 1) * 78.233) * 43758.5453;
    return x - Math.floor(x) > 0.5;
  };

  const rects = [];
  for (let r = 0; r < modules; r += 1) {
    for (let c = 0; c < modules; c += 1) {
      const filled = inFinderBox(r, c) ? finderFilled(r, c) : dataFilled(r, c);
      if (filled) {
        rects.push(
          <rect
            key={`${r}-${c}`}
            x={(c + quiet) * cell}
            y={(r + quiet) * cell}
            width={cell}
            height={cell}
          />,
        );
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label="Dummy UPI QR code"
      className="rounded-xl border border-sandal bg-white"
    >
      <rect width={size} height={size} fill="#ffffff" />
      <g fill="#211911">{rects}</g>
    </svg>
  );
}
