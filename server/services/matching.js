const weight=v=>({required:16,important:11,nice:6,none:0}[String(v||"nice").toLowerCase().split(" ")[0]]??6);
export function scoreProfiles(user,candidate,feedback) {
  const u=user.lifestyle||{},p=candidate.lifestyle||{},deal=user.dealBreakers||{},conflicts=[];
  if(deal.noSmoking&&p.smoking!=="No")conflicts.push("Smoke-free home is required");
  if(deal.noPets&&p.pets!=="No pets")conflicts.push("No-pets preference conflicts");
  if(deal.dietRequired&&user.diet!==candidate.diet)conflicts.push("Food preference must match");
  if(conflicts.length)return {score:0,excluded:true,conflicts,explanation:[]};
  let earned=30,possible=30;const explanation=[];
  const add=(name,ok,max,detail)=>{possible+=max;if(ok)earned+=max;explanation.push({name,matched:ok,points:ok?max:0,max,detail})};
  add("Location",candidate.city?.toLowerCase().includes(user.city?.split(",")[0].toLowerCase()),14,candidate.city);
  add("Budget",Math.abs((candidate.budget||0)-(user.budget||0))<=200,weight(user.weights?.budget),`$${candidate.budget}`);
  add("Cleanliness",!u.cleanliness||u.cleanliness===p.cleanliness,weight(user.weights?.cleanliness),p.cleanliness);
  add("Schedule",!u.schedule||u.schedule===p.schedule,weight(user.weights?.schedule),p.schedule);
  add("Diet",user.diet===candidate.diet,7,candidate.diet);
  let score=Math.round(earned/possible*100)+(feedback==="more"?4:feedback==="less"?-8:0);
  return {score:Math.max(30,Math.min(98,score)),excluded:false,conflicts:[],explanation};
}
