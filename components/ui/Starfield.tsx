// A fixed pattern of twinkling stars. Positions come from a tiny seeded
// generator, so the server and the browser draw the same sky and it never
// reshuffles when the page re-renders.
function seeded(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const STARS = Array.from({ length: 100 }, (_, i) => ({
  left: `${(seeded(i * 4 + 1) * 100).toFixed(2)}%`,
  top: `${(seeded(i * 4 + 2) * 100).toFixed(2)}%`,
  animationDelay: `${(seeded(i * 4 + 3) * 3).toFixed(2)}s`,
  animationDuration: `${(2 + seeded(i * 4 + 4) * 2).toFixed(2)}s`,
}));

export default function Starfield() {
  return (
    <div className="stars" aria-hidden="true">
      {STARS.map((style, i) => (
        <span key={i} className="star" style={style} />
      ))}
    </div>
  );
}
