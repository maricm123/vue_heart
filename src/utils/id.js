export function toClientId(id) {
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}