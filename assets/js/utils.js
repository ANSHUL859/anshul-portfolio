export function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

export function smoothstep(edge0, edge1, value) {
  const t = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}