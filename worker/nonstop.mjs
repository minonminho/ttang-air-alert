// Google Flights provides a readable leg description for every selected flight.
// Be strict: if either leg is unknown, we cannot certify a nonstop round trip.
export function isNonstopFlightDescription(description) {
  const text = String(description || "");
  return /\bnon[\s-]?stop\s+flight\b/i.test(text)
    && !/\b(?:\d+\s+stops?|connecting\s+flight|one\s+stop)\b/i.test(text);
}

export function isNonstopRoundTrip(result) {
  return isNonstopFlightDescription(result?.outbound?.description)
    && isNonstopFlightDescription(result?.inbound?.description);
}
