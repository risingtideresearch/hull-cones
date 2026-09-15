// Developable topsides from the trimmed chine up to an authored sheer.
// Run:  node test/strict_dom_check.js index.html experiments/topsides.js
//
// A developable loft joins A(s) to B(t) by a ruling only where the tangents and the chord are coplanar:
//   det[A'(s), B'(t), B(t)-A(s)] = 0.
// Trace that pairing along the chine. Where t jumps FORWARD the sheer piece in between is covered by a
// cone fan with its apex on the chine, which is legitimate and (proved below) tangent-continuous with its
// neighbours. Where t goes BACKWARD the rulings cross and no developable exists.
// det3 comes from the page (the tool now does this loft itself)
const f3=(x,n)=>(+x).toFixed(n===undefined?3:n);
const LOA=st.plan[NCONE][0];

// ---- the chine = the trimmed edge, one-sided tangents at the seams
const CH=[];
// NOTE the end samples ARE the snapped seam corners, which carry the display seam's few-mm error.
// Taking one-sided tangents straight off them corrupts the kink and invents overlaps: use the interior.
trims.forEach((t,j)=>{const P=t.map(e=>e.Q),n=P.length;
 for(let i=1;i<=n-2;i++)CH.push({P:P[i],T:unit(sub(P[i+1],P[i-1])),j,first:i===1,last:i===n-2});});
console.log('chine: '+CH.length+' samples over x '+f3(CH[0].P[0])+'..'+f3(CH[CH.length-1].P[0]));
console.log('\n(1) the chine\'s own kink at each seam');
for(let v=1;v<NCONE;v++){const a=CH.filter(c=>c.j===v-1).pop(),b=CH.filter(c=>c.j===v)[0];
 console.log('   seam V'+v+' at x='+f3(a.P[0],2)+': '+f3(deg(Math.acos(Math.min(1,dot(a.T,b.T)))),2)+' deg');}

// ---- sheer: plan = flare x the chine's plan spline, profile = quadratic through three heights
function sheerOf(p){
 const fl=x=>p.f0+(p.f1-p.f0)*x/LOA;
 const zq=x=>{const u=x/LOA;return p.z0*(1-u)*(1-2*u)+p.zm*4*u*(1-u)+p.zL*u*(2*u-1);};
 const S=x=>[x,(1+fl(x))*der.g(x),zq(x)];
 const Sd=x=>{const h=1e-5,a=S(Math.max(0,x-h)),b=S(Math.min(LOA,x+h));return unit(sub(b,a));};
 return{S,Sd};}
const BASE={f0:0.12,f1:0.12,z0:1.75,zm:1.10,zL:1.25};

// ---- all roots of the coplanarity condition, pick the one nearest the previous
function pair(sh,Ep,Te,prev){
 const f=t=>det3(Te,sh.Sd(t),sub(sh.S(t),Ep));
 const n=400,roots=[];let pa=0,fa=f(0);
 for(let i=1;i<=n;i++){const t=LOA*i/n,fb=f(t);
  if(fa*fb<0){let a=pa,b=t,va=fa;for(let k=0;k<60;k++){const m=(a+b)/2,vm=f(m);if(va*vm<=0)b=m;else{a=m;va=vm;}}roots.push((a+b)/2);}
  pa=t;fa=fb;}
 if(!roots.length)return null;
 return roots.reduce((best,r)=>Math.abs(r-prev)<Math.abs(best-prev)?r:best,roots[0]);}

function trace(sh){
 const out=[];let prev=0;
 for(const c of CH){const t=pair(sh,c.P,c.T,prev);out.push(t===null?null:{t,c});if(t!==null)prev=t;}
 const ev=[];                                        // jumps: at the bow, at each seam, at the transom
 const ok=out.filter(r=>r);
 if(!ok.length)return{out,ev,dead:true};
 ev.push({where:'bow',tm:0,tp:ok[0].t,P:ok[0].c.P,Tm:null,Tp:ok[0].c.T});
 for(let v=1;v<NCONE;v++){const A=out.filter(r=>r&&r.c.j===v-1).pop(),B=out.filter(r=>r&&r.c.j===v)[0];
  if(A&&B)ev.push({where:'seam V'+v,tm:A.t,tp:B.t,P:A.c.P,Tm:A.c.T,Tp:B.c.T});}
 const lastR=ok[ok.length-1];
 ev.push({where:'transom',tm:lastR.t,tp:LOA,P:lastR.c.P,Tm:lastR.c.T,Tp:null});
 // backward steps INSIDE a plate = genuine ruling crossing
 let back=0,worst=0;
 for(let i=1;i<out.length;i++){const a=out[i-1],b=out[i];
  if(a&&b&&a.c.j===b.c.j&&b.t<a.t-1e-9){back++;worst=Math.max(worst,a.t-b.t);}}
 return{out,ev,back,worst,unpaired:out.filter(r=>!r).length};}

console.log('\n(2) baseline sheer: flare '+BASE.f0+', deck z '+BASE.z0+'/'+BASE.zm+'/'+BASE.zL);
const sh=sheerOf(BASE),tr=trace(sh);
console.log('   chine samples with no pairing: '+tr.unpaired+';  backward steps inside a plate: '+tr.back+
            (tr.back?' (worst '+f3(tr.worst)+' m => rulings cross)':''));
for(const e of tr.ev){const d=e.tp-e.tm;
 console.log('   '+e.where.padEnd(9)+': sheer '+f3(e.tm)+' -> '+f3(e.tp)+'  ('+(d>=0?'+':'')+f3(d)+' m)  '+
  (d>1e-4?'fan from the chine, apex x='+f3(e.P[0],2):d<-1e-4?'*** OVERLAP: rulings cross ***':'exact: that edge is a ruling'));}

console.log('\n(3) are the fans tangent-continuous with their neighbours?');
for(const e of tr.ev){const d=e.tp-e.tm;if(d<=1e-4)continue;
 const r1=sub(sh.S(e.tm),e.P),r2=sub(sh.S(e.tp),e.P);
 const ang=(a,b)=>deg(Math.acos(Math.min(1,Math.abs(dot(unit(a),unit(b))))));
 const parts=[];
 if(e.Tm)parts.push('panel|fan '+f3(ang(cross(e.Tm,r1),cross(r1,sh.Sd(e.tm))),4)+' deg');
 if(e.Tp)parts.push('fan|panel '+f3(ang(cross(r2,sh.Sd(e.tp)),cross(e.Tp,r2)),4)+' deg');
 console.log('   '+e.where.padEnd(9)+': '+parts.join(', ')+';  fan opens '+f3(deg(Math.acos(Math.min(1,dot(unit(r1),unit(r2))))),2)+' deg');}

console.log('\n(4) ruling rake from transverse (+ = sloping aft)');
{const a=tr.out.filter(r=>r).map(r=>{const d=sub(sh.S(r.t),r.c.P);return deg(Math.atan2(d[0],Math.hypot(d[1],d[2])));});
 console.log('   '+f3(Math.min(...a),1)+'..'+f3(Math.max(...a),1)+' deg');}

console.log('\n(5) feasibility: which sheers avoid an overlap?   (deck height amidships x flare)');
console.log('   '+['zm\\flare','0','0.06','0.12','0.20','0.30'].map(h=>h.padStart(12)).join(''));
for(const zm of [0.7,0.9,1.1,1.4,1.8]){const row=[String(zm)];
 for(const fl of [0,0.06,0.12,0.20,0.30]){
  const t=trace(sheerOf(Object.assign({},BASE,{zm,f0:fl,f1:fl})));
  const ov=t.ev.filter(e=>e.tp-e.tm<-1e-4).map(e=>e.where.replace('seam ',''));
  row.push(t.dead?'none':t.back?('cross '+t.back):ov.length?('ovl '+ov.join(',')):'ok');}
 console.log('   '+row.map(h=>h.padStart(12)).join(''));}

console.log('\n(6) seam V3 is the failure. Can the AFT sheer fix it?  (transom deck height x aft flare)');
console.log('   '+['zL\\f1','0','0.10','0.20','0.35','0.50'].map(h=>h.padStart(13)).join(''));
for(const zL of [0.9,1.25,1.6,2.0]){const row=[String(zL)];
 for(const f1 of [0,0.10,0.20,0.35,0.50]){
  const t=trace(sheerOf(Object.assign({},BASE,{zL,f1})));
  const e=t.ev.find(q=>q.where==='seam V3');const d=e?e.tp-e.tm:NaN;
  row.push((d>=0?'+':'')+f3(d,2)+(t.back?'/x'+t.back:''));}
 console.log('   '+row.map(h=>h.padStart(13)).join(''));}
console.log('   (+ = fan, fine;  - = overlap, fatal;  /xN = N backward steps inside a plate)');

console.log('\n(7) where the in-plate crossings are, for the baseline');
{const t=trace(sh);let n=0;
 for(let i=1;i<t.out.length;i++){const a=t.out[i-1],b=t.out[i];
  if(a&&b&&a.c.j===b.c.j&&b.t<a.t-1e-9&&n<6){n++;
   console.log('   plate '+a.c.j+' at chine x='+f3(a.c.P[0],2)+': sheer t '+f3(a.t)+' -> '+f3(b.t)+'  ('+f3(b.t-a.t,4)+' m)');}}
 if(!n)console.log('   none');}

console.log('\n(8) hypothesis: the fan/overlap sign follows whether the chine is still WIDENING at the kink.');
console.log('   chine plan slope just fore/aft of each seam, against the outcome above:');
for(let v=1;v<NCONE;v++){const A=CH.filter(c=>c.j===v-1).pop(),B=CH.filter(c=>c.j===v)[0];
 const e=tr.ev.find(q=>q.where==='seam V'+v);
 console.log('   V'+v+': dy/dx '+f3(A.T[1]/A.T[0],4)+' -> '+f3(B.T[1]/B.T[0],4)+'   '+((e.tp-e.tm)>0?'fan':'OVERLAP'));}
console.log('   test: widen V3 so the chine is still widening there, and re-pair');
st.plan[3][1]=1.55;update();
{const CH2=[];trims.forEach((t,j)=>{const P=t.map(e=>e.Q),n=P.length;
  for(let i=1;i<=n-2;i++)CH2.push({P:P[i],T:unit(sub(P[i+1],P[i-1])),j});});
 CH.length=0;CH2.forEach(c=>CH.push(c));
 const t2=trace(sheerOf(BASE));
 for(const e of t2.ev){const d=e.tp-e.tm;
  console.log('   '+e.where.padEnd(9)+': '+(d>=0?'+':'')+f3(d)+' m  '+(d>1e-4?'fan':d<-1e-4?'OVERLAP':'exact'));}
 console.log('   backward steps inside a plate: '+t2.back);}
