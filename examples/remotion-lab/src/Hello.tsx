import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const Hello: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14 } });
  const y = interpolate(s, [0, 1], [120, 0]);
  return (
    <AbsoluteFill style={{ background: "#05060A", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ color: "#E4B94B", fontSize: 150, fontWeight: 900, opacity: s, transform: `translateY(${y}px)` }}>Remotion</div>
      <div style={{ color: "#8A8F9A", fontSize: 44, marginTop: 24, opacity: interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" }) }}>cài thử trong remotion-lab</div>
    </AbsoluteFill>
  );
};
