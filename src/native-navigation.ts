import {execFile} from 'node:child_process';
import * as path from 'node:path';
import type {Navigation,Region} from './navigation';
let cancelRunning:(()=>void)|undefined;
export function cancelNativeNavigation(){cancelRunning?.();cancelRunning=undefined;}
async function query(args:string[]):Promise<string>{cancelNativeNavigation();return new Promise((resolve,reject)=>{
 let obsolete=false;
 const child=execFile('synctex',args,{windowsHide:true,timeout:5000,maxBuffer:1024*1024,env:{...process.env,SYNCTEX_VIEWER:'',SYNCTEX_EDITOR:''}},(error,stdout)=>{
  if(cancelRunning===cancel)cancelRunning=undefined;
  if(obsolete)resolve('');else if(error)reject(Error('SyncTeX navigation failed: '+error.message));else resolve(stdout);
 });
 const cancel=()=>{obsolete=true;child.kill();};cancelRunning=cancel;
});}
const field=(result:string,key:string)=>result.match(new RegExp('^'+key+':([^\\r\\n]+)','m'))?.[1];
export async function nativeForward(pdf:string,nav:Navigation,file:string,line:number,page:number,column=0,docText?:string):Promise<Region|undefined>{
 const input=nav.nativeInputs?.[file];if(!input)return;
 const colArg=Math.max(1,column);
 const result=await query(['view','-i',`${line}:${colArg}:${input}`,'-o',pdf]);
 const blocks=result.split(/(?=Output:)/g).filter(b=>b.startsWith('Output:')||b.includes('Page:'));
 const parsed:{page:number;x:number;y:number;h:number;v:number;width:number;height:number}[]=[];
 for(const b of blocks){
  const p=Number(b.match(/^Page:([^\r\n]+)/m)?.[1]);
  const x=Number(b.match(/^x:([^\r\n]+)/m)?.[1]);
  const y=Number(b.match(/^y:([^\r\n]+)/m)?.[1]);
  const h=Number(b.match(/^h:([^\r\n]+)/m)?.[1]);
  const v=Number(b.match(/^v:([^\r\n]+)/m)?.[1]);
  const width=Number(b.match(/^W:([^\r\n]+)/m)?.[1]);
  const height=Number(b.match(/^H:([^\r\n]+)/m)?.[1]);
  if([p,x,y,h,v,width,height].every(Number.isFinite)&&p>0)parsed.push({page:p,x,y,h,v,width,height});
 }
 if(!parsed.length)return;
 parsed.sort((a,b)=>a.page!==b.page?a.page-b.page:a.v!==b.v?a.v-b.v:a.h-b.h);
 if(parsed.length===1){
  const b=parsed[0];
  const w=Math.min(30,Math.max(15,b.width));
  return [file,line,b.page,b.x,b.v-b.height,w,Math.max(5,b.height)];
 }
 const lineContent=docText?(docText.split('\n')[line-1]??''):'';
 const totalChars=Math.max(1,lineContent.length);
 const ratio=Math.max(0,Math.min(0.999,column/totalChars));
 const lineIdx=Math.floor(ratio*parsed.length);
 const sel=parsed[lineIdx];
 const lineRatio=(ratio*parsed.length)-lineIdx;
 const wordX=sel.h+lineRatio*Math.max(0,sel.width-30);
 const wordY=sel.v-sel.height;
 return [file,line,sel.page,wordX,wordY,Math.min(30,Math.max(15,sel.width)),Math.max(5,sel.height)];
}
export async function nativeBackward(pdf:string,nav:Navigation,page:number,x:number,y:number):Promise<Region|undefined>{
 const result=await query(['edit','-o',`${page}:${x}:${y}:${pdf}`]);
 const input=field(result,'Input'),line=Number(field(result,'Line'));
 const file=input?Object.keys(nav.nativeInputs??{}).find(file=>path.resolve(nav.nativeInputs![file]).toLowerCase()===path.resolve(input).toLowerCase()):undefined;
 if(file&&Number.isInteger(line)&&line>0)return [file,line,page,x,y,1,5];
}
