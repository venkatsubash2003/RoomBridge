export async function commuteEstimate(from,to) {
  if(process.env.MAPS_PROVIDER_URL&&process.env.MAPS_API_KEY){
    const response=await fetch(process.env.MAPS_PROVIDER_URL,{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${process.env.MAPS_API_KEY}`},body:JSON.stringify({from,to,mode:"transit"}),signal:AbortSignal.timeout(10_000)});
    if(!response.ok)throw new Error(`Maps provider returned ${response.status}`);
    const result=await response.json();if(!Number.isFinite(Number(result.minutes)))throw new Error("Maps provider response is invalid");
    return {minutes:Number(result.minutes),mode:result.mode||"transit",provider:"configured"};
  }
  const seed=[...`${from}:${to}`].reduce((n,c)=>n+c.charCodeAt(0),0);
  return {minutes:15+(seed%46),mode:"transit",provider:"development-estimate"};
}
