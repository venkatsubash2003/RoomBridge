import http from "k6/http";
import { check, sleep } from "k6";

export const options={
  scenarios:{
    steady:{executor:"ramping-vus",startVUs:0,stages:[{duration:"30s",target:25},{duration:"2m",target:25},{duration:"30s",target:0}]}
  },
  thresholds:{
    http_req_failed:["rate<0.01"],
    http_req_duration:["p(95)<500","p(99)<1000"]
  }
};

const base=__ENV.BASE_URL||"http://127.0.0.1:8080";
export default function(){
  const health=http.get(`${base}/api/health/live`);
  check(health,{"liveness is healthy":response=>response.status===200});
  const home=http.get(`${base}/`);
  check(home,{"home renders":response=>response.status===200&&response.body.includes("RoomBridge")});
  sleep(Math.random()*2);
}
