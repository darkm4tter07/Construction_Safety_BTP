export function riskColor(score, max) {
  if (score == null) return { bg: "bg-gray-500" };
  const r = score / max;
  if (r < 0.3) return { bg: "bg-green-500" };
  if (r < 0.6) return { bg: "bg-yellow-500" };
  return { bg: "bg-red-500" };
}
