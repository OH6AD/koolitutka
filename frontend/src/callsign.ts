export function normalizeCallsign(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export function neighbour(callsign: string): string {
  if (callsign.length < 3) return callsign;
  return `${callsign.slice(0, 2)}*${callsign.slice(3)}`;
}
