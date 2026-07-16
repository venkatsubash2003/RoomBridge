const suspicious=[/wire transfer/i,/gift card/i,/crypto/i,/deposit.*before/i,/send money/i,/outside (the )?app/i];
export async function fraudSignal(text) {
  const hits=suspicious.filter(x=>x.test(text)).length;
  if(!process.env.OPENAI_API_KEY)return {score:Math.min(1,hits*.38),labels:hits?["advance-payment-risk"]:[],provider:"local-rules"};
  return {score:Math.min(1,hits*.38),labels:hits?["advance-payment-risk"]:[],provider:"local-guardrail"};
}
export async function translate(text,targetLanguage) {
  if(!process.env.OPENAI_API_KEY)return {text:`[${targetLanguage}] ${text}`,provider:"demo-fallback"};
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-4.1-mini",input:`Translate to ${targetLanguage}. Return only the translation:\n${text}`})});
  if(!response.ok)throw new Error("Translation provider failed");const data=await response.json();return {text:data.output_text,provider:"openai"};
}
export async function personalizedRerank(items) { return [...items].sort((a,b)=>b.score-a.score); }
