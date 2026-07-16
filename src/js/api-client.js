window.RoomBridgeAPI = {
  async request(path, options={}) {
    const response=await fetch(`/api${path}`,{credentials:"same-origin",headers:{"Content-Type":"application/json",...(options.headers||{})},...options,body:options.body&&typeof options.body!=="string"?JSON.stringify(options.body):options.body});
    const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||`Request failed (${response.status})`);return data;
  },
  health(){return this.request("/health")},
  me(){return this.request("/auth/me")},
  register(data){return this.request("/auth/register",{method:"POST",body:data})},
  verify(data){return this.request("/auth/verify",{method:"POST",body:data})},
  resendCode(verificationId){return this.request("/auth/resend",{method:"POST",body:{verificationId}})},
  login(data){return this.request("/auth/login",{method:"POST",body:data})},
  logout(){return this.request("/auth/logout",{method:"POST"})},
  profile(){return this.request("/profile")},
  saveProfile(data){return this.request("/profile",{method:"PUT",body:data})},
  listings(filters={}){return this.request(`/listings?${new URLSearchParams(filters)}`)},
  createListing(data){return this.request("/listings",{method:"POST",body:data})},
  saveSearch(data){return this.request("/saved-searches",{method:"POST",body:data})},
  requestVerification(data){return this.request("/verifications",{method:"POST",body:data})},
  matches(){return this.request("/matches")},
  conversations(){return this.request("/conversations")},
  messages(id){return this.request(`/conversations/${id}/messages`)},
  sendMessage(id,data){return this.request(`/conversations/${id}/messages`,{method:"POST",body:data})},
  translate(text,targetLanguage){return this.request("/ai/translate",{method:"POST",body:{text,targetLanguage}})},
  events(onEvent){const events=new EventSource("/api/events");events.addEventListener("message",e=>onEvent("message",JSON.parse(e.data)));return events;}
};
