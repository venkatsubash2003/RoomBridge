export function commuteEstimate(from,to) {
  const seed=[...`${from}:${to}`].reduce((n,c)=>n+c.charCodeAt(0),0);
  return {minutes:15+(seed%46),mode:"transit",provider:process.env.MAPS_API_KEY?"provider-ready":"deterministic-fallback"};
}
