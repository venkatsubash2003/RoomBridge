const counters=new Map(),durations=new Map();
const routeName=pathname=>pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi,":id").replace(/\/\d+(?=\/|$)/g,"/:id");
const increment=(map,key,value=1)=>map.set(key,(map.get(key)||0)+value);

export function observeRequest(req,res,requestId){
  const start=process.hrtime.bigint();
  res.once("finish",()=>{
    const seconds=Number(process.hrtime.bigint()-start)/1e9,route=routeName(new URL(req.url,"http://localhost").pathname),key=`${req.method}|${route}|${res.statusCode}`;
    increment(counters,key);increment(durations,key,seconds);
    console.log(JSON.stringify({level:"info",message:"request_complete",requestId,method:req.method,route,status:res.statusCode,durationMs:Math.round(seconds*1000)}));
  });
}

export function metrics(){
  const lines=["# HELP roombridge_http_requests_total Completed HTTP requests","# TYPE roombridge_http_requests_total counter"];
  for(const [key,value] of counters){const [method,route,status]=key.split("|");lines.push(`roombridge_http_requests_total{method="${method}",route="${route}",status="${status}"} ${value}`)}
  lines.push("# HELP roombridge_http_request_duration_seconds_sum Total request duration","# TYPE roombridge_http_request_duration_seconds_sum counter");
  for(const [key,value] of durations){const [method,route,status]=key.split("|");lines.push(`roombridge_http_request_duration_seconds_sum{method="${method}",route="${route}",status="${status}"} ${value}`)}
  lines.push(`roombridge_process_uptime_seconds ${process.uptime()}`,`roombridge_process_resident_memory_bytes ${process.memoryUsage().rss}`);
  return lines.join("\n")+"\n";
}
