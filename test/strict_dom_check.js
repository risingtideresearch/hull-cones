const fs=require("fs");const file=process.argv[2];if(!file){console.log("usage: node strict_dom_check.js <page.html> [extra-js-file]");process.exit(1);}
let html=fs.readFileSync(file,"utf8");
// concatenate every <script> block (pages may have several)
let s=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join("\n");
s=s.replace("let sec=[],keel=[],folds={};","sec=[];keel=[];folds={};").replace("let shift=[0,0,0,0,0],drop=0.35,lines=[],kv=[],warns=[];","shift=[0,0,0,0,0];drop=0.35;lines=[];kv=[];warns=[];");
if(process.argv[3])s+="\n"+fs.readFileSync(process.argv[3],"utf8");
const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
const dyn=new Set(); // ids created via innerHTML
// default values: value="" attribute of the element carrying the id, or the selected/first <option> of a select
const defaults={full:0.6,master:2,kz:-0.25};
for(const m of html.matchAll(/<(input|select)\b([^>]*)>/g)){const id=/id="([^"]+)"/.exec(m[2]);if(!id)continue;
  if(m[1]==="input"){const v=/value="([^"]*)"/.exec(m[2]);if(v)defaults[id[1]]=v[1];}
  else{const body=html.slice(m.index+m[0].length,html.indexOf("</select>",m.index));const opts=[...body.matchAll(/<option([^>]*)>([^<]*)/g)];
    const sel=opts.find(o=>/selected/.test(o[1]))||opts[0];if(sel){const v=/value="([^"]*)"/.exec(sel[1]);defaults[id[1]]=v?v[1]:sel[2].trim();}}}
const els={};const ctxStub=new Proxy({},{get:()=>()=>{}});
const mk=(id)=>({value:defaults[id]??0,textContent:"",checked:true,style:{},dataset:{},addEventListener(){},getContext(){return ctxStub},clientWidth:800,clientHeight:400,
  set innerHTML(h){[...h.matchAll(/id="([^"]+)"/g)].forEach(m=>dyn.add(m[1]));},get innerHTML(){return ""}});
global.document={getElementById:id=>{if(!ids.has(id)&&!dyn.has(id)){console.log("MISSING element id:",id);return null;}return els[id]||(els[id]=mk(id));},querySelectorAll:()=>[]};
global.window={devicePixelRatio:1,addEventListener(){}};
// top-level declarations that collide with an unforgeable window property are a SyntaxError in a browser
// but not in node's function scope, so lint for them (this is how `let top` shipped once).
const HARD=new Set(["window","document","location","top"]);
const SOFT=new Set(["self","parent","frames","name","length","status","closed","origin","event","history","navigator","screen","opener"]);
{const names=[];
 for(const line of s.split("\n")){
  let m=/^(?:function|class)\s+([A-Za-z_$][\w$]*)/.exec(line);
  if(m){names.push(m[1]);continue;}
  m=/^(?:let|const|var)\s+(.*)$/.exec(line);
  if(!m)continue;
  let d=0,tok="",expect=true;
  for(const c of m[1]){
   if("([{".includes(c))d++;else if(")]}".includes(c))d--;
   if(d===0&&c===","){expect=true;tok="";continue;}
   if(d===0&&(c==="="||c===";")){if(expect&&tok.trim())names.push(tok.trim());expect=false;tok="";continue;}
   if(expect)tok+=c;}
  if(expect&&tok.trim())names.push(tok.trim());}
 for(const n of names){
  if(HARD.has(n))console.log("FATAL: top-level `"+n+"` shadows an unforgeable window property (SyntaxError in a browser)");
  else if(SOFT.has(n))console.log("WARNING: top-level `"+n+"` shadows a window property");}}
try{eval(s);console.log("ran OK");}catch(e){console.log("ERROR:",e.stack.split("\n").slice(0,3).join("\n"));}
