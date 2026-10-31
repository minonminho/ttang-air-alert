import { DESTINATIONS } from "./google-playwright.mjs";

// Keep the 26 city markers unchanged; GMP-HND appears under Tokyo (NRT city).
export const SEARCH_ROUTES = new Map([
  ...[...DESTINATIONS.entries()].map(([code, destination]) => [code, {
    routeId: code, departureCode: "ICN", arrivalAirportCode: code,
    destinationCode: code, destination,
  }]),
  ["GMP-HND", {
    routeId: "GMP-HND", departureCode: "GMP", arrivalAirportCode: "HND",
    destinationCode: "NRT", destination: "도쿄",
  }],
  ["GMP-KIX", {
    routeId: "GMP-KIX", departureCode: "GMP", arrivalAirportCode: "KIX",
    destinationCode: "KIX", destination: "오사카",
  }],
]);

export function getSearchRoute(routeId) {
  const route = SEARCH_ROUTES.get(routeId);
  if (!route) throw new Error(`지원하지 않는 검색 노선입니다: ${routeId}`);
  return route;
}
