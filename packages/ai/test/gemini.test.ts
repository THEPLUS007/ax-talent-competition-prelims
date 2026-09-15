import { describe, expect, it, vi } from 'vitest';
import { AiProviderError, GeminiTravelAiProvider } from '../src/index.js';
const valid={trip:{name:'서울',country:'대한민국',city:'서울',duration:'1일',budget:'',travelers:'',style:'',description:''},days:[],connections:[]};
const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
const gemini=(text:string)=>({candidates:[{content:{parts:[{text}]}}]});
describe('Gemini adapter',()=>{
  it('structured output을 검증한다',async()=>expect(new GeminiTravelAiProvider({apiKey:'test',fetch:async()=>response(gemini(JSON.stringify(valid)))}).generateTrip({prompt:'서울'})).resolves.toEqual(valid));
  it('malformed output을 차단한다',async()=>expect(new GeminiTravelAiProvider({apiKey:'test',fetch:async()=>response(gemini('{bad'))}).generateTrip({prompt:'서울'})).rejects.toMatchObject({code:'invalid_output'}));
  it.each([[429,'rate_limit'],[503,'unavailable']])('%s 오류를 분류한다',async(status,code)=>expect(new GeminiTravelAiProvider({apiKey:'test',maxRetries:0,fetch:async()=>response({},status as number)}).generateTrip({prompt:'서울'})).rejects.toMatchObject({code}));
  it('빈 결과를 차단한다',async()=>expect(new GeminiTravelAiProvider({apiKey:'test',fetch:async()=>response({candidates:[]})}).generateTrip({prompt:'서울'})).rejects.toBeInstanceOf(AiProviderError));
  it('timeout을 분류한다',async()=>expect(new GeminiTravelAiProvider({apiKey:'test',timeoutMs:1,longTaskTimeoutMs:1,maxRetries:0,fetch:(_,init)=>new Promise((_,reject)=>init?.signal?.addEventListener('abort',()=>reject(new DOMException('x','AbortError'))))}).generateTrip({prompt:'서울'})).rejects.toMatchObject({code:'timeout'}));
  it('long generate_trip은 short timeout을 넘어도 long timeout 안에서 성공한다',async()=>{
    vi.useFakeTimers();
    try {
      const fetcher=vi.fn(async()=>new Promise<Response>((resolve)=>setTimeout(()=>resolve(response(gemini(JSON.stringify(valid)))),5)));
      const result=new GeminiTravelAiProvider({apiKey:'test',timeoutMs:1,longTaskTimeoutMs:40,maxRetries:0,fetch:fetcher}).generateTrip({prompt:'서울'});
      await vi.advanceTimersByTimeAsync(5);
      await expect(result).resolves.toEqual(valid);
      expect(fetcher).toHaveBeenCalledOnce();
    } finally { vi.useRealTimers(); }
  });
  it.each([
    ['generate_trip',(provider:GeminiTravelAiProvider)=>provider.generateTrip({prompt:'서울'})],
    ['analyze_text',(provider:GeminiTravelAiProvider)=>provider.analyzeText({content:'부산 2박 3일 일정'})],
  ])('%s timeout은 long task에서 재시도하지 않고 telemetry attempt를 1로 남긴다',async(_task,run)=>{
    vi.useFakeTimers();
    try {
      const events:any[]=[]; const fetcher=vi.fn((_:unknown,init:RequestInit)=>new Promise((_,reject)=>init.signal?.addEventListener('abort',()=>reject(new DOMException('x','AbortError')))));
      const provider=new GeminiTravelAiProvider({apiKey:'test',timeoutMs:1,longTaskTimeoutMs:1,maxRetries:2,observer:{record:(event)=>events.push(event)},fetch:fetcher});
      const result=run(provider);
      const assertion=expect(result).rejects.toMatchObject({code:'timeout'});
      await vi.advanceTimersByTimeAsync(1);
      await assertion;
      expect(fetcher).toHaveBeenCalledOnce();
      expect(events).toEqual([expect.objectContaining({status:'error',providerAttempts:1,errorCode:'timeout'})]);
    } finally { vi.useRealTimers(); }
  });
  it('short rank_places timeout은 기존 bounded retry policy를 유지한다',async()=>{
    vi.useFakeTimers();
    try {
      const fetcher=vi.fn((_:unknown,init:RequestInit)=>new Promise((_,reject)=>init.signal?.addEventListener('abort',()=>reject(new DOMException('x','AbortError')))));
      const provider=new GeminiTravelAiProvider({apiKey:'test',timeoutMs:1,longTaskTimeoutMs:40,maxRetries:1,wait:async()=>undefined,fetch:fetcher});
      const result=provider.recommendPlaces({trip:valid.trip,day:{id:'day-1',dayNumber:1,title:'첫째 날',blocks:[]},existingPlaces:[]});
      const assertion=expect(result).rejects.toMatchObject({code:'timeout'});
      await vi.advanceTimersByTimeAsync(1);
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(1);
      await assertion;
      expect(fetcher).toHaveBeenCalledTimes(2);
    } finally { vi.useRealTimers(); }
  });
});

describe('Gemini quota guardrails (mock only)',()=>{
  it('honors Retry-After on 429',async()=>{let calls=0;const delays:number[]=[];const provider=new GeminiTravelAiProvider({apiKey:'test',maxRetries:1,wait:async(ms)=>{delays.push(ms);},fetch:async()=>++calls===1?new Response('{}',{status:429,headers:{'retry-after':'3'}}):response(gemini(JSON.stringify(valid)))});await expect(provider.generateTrip({prompt:'서울'})).resolves.toEqual(valid);expect(delays).toEqual([3000]);expect(calls).toBe(2);});
  it('uses jittered exponential backoff when Retry-After is absent',async()=>{let calls=0;const delays:number[]=[];const provider=new GeminiTravelAiProvider({apiKey:'test',maxRetries:2,random:()=>0,wait:async(ms)=>{delays.push(ms);},fetch:async()=>++calls<3?response({},429):response(gemini(JSON.stringify(valid)))});await provider.generateTrip({prompt:'서울'});expect(delays).toEqual([800,1600]);});
  it.each([400,401,403])('does not retry non-retryable HTTP %i',async(status)=>{const fetcher=vi.fn(async()=>response({},status));await expect(new GeminiTravelAiProvider({apiKey:'test',maxRetries:2,fetch:fetcher}).generateTrip({prompt:'서울'})).rejects.toBeInstanceOf(AiProviderError);expect(fetcher).toHaveBeenCalledOnce();});
  it.each([500,503])('retries retryable HTTP %i',async(status)=>{let calls=0;const fetcher=vi.fn(async()=>++calls===1?response({},status):response(gemini(JSON.stringify(valid))));await expect(new GeminiTravelAiProvider({apiKey:'test',maxRetries:1,wait:async()=>undefined,fetch:fetcher}).generateTrip({prompt:'서울'})).resolves.toEqual(valid);expect(fetcher).toHaveBeenCalledTimes(2);});
  it('stops after maxRetries and records safe telemetry',async()=>{const events:any[]=[];const fetcher=vi.fn(async()=>response({},429));await expect(new GeminiTravelAiProvider({apiKey:'test',maxRetries:1,wait:async()=>undefined,observer:{record:(event)=>events.push(event)},fetch:fetcher}).generateTrip({prompt:'서울'})).rejects.toMatchObject({code:'rate_limit'});expect(fetcher).toHaveBeenCalledTimes(2);expect(events).toEqual([expect.objectContaining({task:'generate_trip',status:'error',providerAttempts:2})]);});
  it('does not fail a successful run when telemetry storage fails',async()=>{const onObserverError=vi.fn();await expect(new GeminiTravelAiProvider({apiKey:'test',observer:{record:()=>{throw new Error('sink down');}},onObserverError,fetch:async()=>response(gemini(JSON.stringify(valid)))}).generateTrip({prompt:'서울'})).resolves.toEqual(valid);await Promise.resolve();expect(onObserverError).toHaveBeenCalledOnce();});
});
