const suspicious=[/wire transfer/i,/gift card/i,/crypto/i,/deposit.*before/i,/send money/i,/outside (the )?app/i];
export async function fraudSignal(text) {
  const hits=suspicious.filter(x=>x.test(text)).length;
  if(!process.env.OPENAI_API_KEY)return {score:Math.min(1,hits*.38),labels:hits?["advance-payment-risk"]:[],provider:"local-rules"};
  return {score:Math.min(1,hits*.38),labels:hits?["advance-payment-risk"]:[],provider:"local-guardrail"};
}
export async function translate(text,targetLanguage) {
  if(!process.env.OPENAI_API_KEY){if(process.env.NODE_ENV==="production")throw new Error("Translation provider is unavailable");return {text:`[Development ${targetLanguage}] ${text}`,provider:"development-placeholder"}}
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-4.1-mini",input:`Translate to ${targetLanguage}. Return only the translation:\n${text}`})});
  if(!response.ok)throw new Error("Translation provider failed");
  const data=await response.json();
  const translated=data.output_text||data.output?.flatMap(item=>item.content||[]).find(item=>item.type==="output_text")?.text;
  if(!translated)throw new Error("Translation provider returned no text");
  return {text:translated,provider:"openai"};
}
export async function personalizedRerank(items) { return [...items].sort((a,b)=>b.score-a.score); }
