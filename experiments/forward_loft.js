// JavaScript port of experiments/forward_loft.py (hybrid: cone chain aft of V2, two-curve
// developable loft forward between a spline chine and the composite lower curve seam+keel).
// Same maths, ~50 ms per case instead of ~10 s.  Run:  node experiments/forward_loft.js
// runHybrid(o): o = {dy0,dz0,f,drop,k0, kB | dk}  (dk = offset of the K_s keel slope from the matched slope)

// ---------------------------------------------------------------- shared helpers
const V=[[0,0,0.9],[2.5,0.85,0.35],[5,1.3,0.1],[7.5,1.3,0.05],[10,0.9,0.15]];
const NP=13,NU=2*NP-1,KI=NP-1;
const C={ink:'#1e2a30',muted:'#7c8a90',light:'#b9c3c8',ruling:'#3aa58a',seam:'#c8512a',master:'#2b6cb0',keel:'#8a4fbf',fwd:'#b8860b',warn:'#b3261e'};
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>Math.hypot(a[0],a[1],a[2]);
const unit=a=>mul(a,1/norm(a));
const mirror=p=>[p[0],-p[1],p[2]];
const deg=r=>r*180/Math.PI;
const fmt=(x,n=2)=>(x===undefined||x===null||!isFinite(x))?'n/a':x.toFixed(n);
function clipPoly(pts){const out=[];for(let i=0;i<pts.length;i++){const p=pts[i];if(p[1]>=-1e-9)out.push(p);else{if(i>0){const q=pts[i-1];out.push(lerp(q,p,q[1]/(q[1]-p[1])));}break;}}return out;}
function clipSeg(a,b){const ya=a[1],yb=b[1];if(ya>=-1e-9&&yb>=-1e-9)return[a,b];if(ya<0&&yb<0)return null;const c=lerp(a,b,ya/(ya-yb));return ya>=0?[a,c]:[c,b];}

// ---------------------------------------------------------------- cone chain (page 04 logic, generic in V)
function coneChain(Vc,m,f,kz,rake,bulge){
 const N=Vc.length-1,segs=[],warns=[];
 for(let j=0;j<N;j++){const A=Vc[j],B=Vc[j+1],d=sub(B,A),dy=d[1];if(Math.abs(dy)<1e-6)segs.push({cyl:true,dir:d});else segs.push({cyl:false,P:add(A,mul(d,-A[1]/dy))});}
 const rdir=(j,Q)=>segs[j].cyl?segs[j].dir:sub(Q,segs[j].P);
 const shift=[];for(let v=0;v<=N;v++)shift[v]=(v>0&&v<N&&rake)?(rake[v]||0):0;
 for(let v=1;v<N;v++)if(Vc[v][0]+shift[v]<Vc[v-1][0]||Vc[v][0]+shift[v]>Vc[v+1][0])warns.push('keel vertex '+v+' raked past a neighbouring chine station');
 const xv=v=>Vc[v][0]+shift[v];
 const lineFrom=(j,x0,z0)=>{const q=segs[j];const sl=q.cyl?q.dir[2]/q.dir[0]:(z0-q.P[2])/(x0-q.P[0]);return{s:sl,z:x=>z0+sl*(x-x0)};};
 const lines=[],kv=[];kv[m]=[xv(m),0,kz];
 for(let j=m;j<N;j++){lines[j]=lineFrom(j,kv[j][0],kv[j][2]);kv[j+1]=[xv(j+1),0,lines[j].z(xv(j+1))];}
 for(let j=m-1;j>=0;j--){lines[j]=lineFrom(j,kv[j+1][0],kv[j+1][2]);kv[j]=[xv(j),0,lines[j].z(xv(j))];}
 for(let j=0;j<N;j++)if(!isFinite(lines[j].s))warns.push('keel line '+j+' is vertical (vertex directly above/below its apex)');
 const seamX=(v,u)=>Vc[v][0]+shift[v]*(1-u)+((bulge&&bulge[v])||0)*4*u*(1-u);
 const cut=(j,Q,v,u)=>{const d=rdir(j,Q);return add(Q,mul(d,(seamX(v,u)-Q[0])/d[0]));};
 const uOf=k=>Math.abs(k-KI)/KI;
 // master frame: cubic Bezier half-section in the inclined plane through chine vertex and keel vertex
 const Km=kv[m],yc=Vc[m][1],w=[Vc[m][0]-Km[0],0,Vc[m][2]-Km[2]],dl=norm(w),wh=mul(w,1/dl);
 const half=u=>{const a=(1-u)**3,b=3*u*(1-u)**2,c=3*u*u*(1-u),e=u**3;const eta=b*0.55*f*yc+c*yc+e*yc,zeta=c*(dl-0.55*f*dl)+e*dl;return add(add(Km,[0,eta,0]),mul(wh,zeta));};
 const halfT=u=>{const h=1e-5,lo=Math.max(u-h,0),hi=Math.min(u+h,1);return mul(sub(half(hi),half(lo)),1/(hi-lo));};
 const sec=[];const mf=[];for(let i=NP-1;i>=0;i--)mf.push(half(i/KI));for(let i=1;i<NP;i++)mf.push(mirror(half(i/KI)));sec[m]=mf;
 for(let j=m;j<N;j++)sec[j+1]=sec[j].map((Q,k)=>j+1<N?cut(j,Q,j+1,uOf(k)):cut(j,Q,j+1,1));
 for(let j=m-1;j>=0;j--)sec[j]=sec[j+1].map((Q,k)=>j>0?cut(j,Q,j,uOf(k)):cut(j,Q,j,1));
 // seam folds (starboard side, k from chine to keel), angle between tangent planes of cone v-1 and cone v
 const seamFold=[];
 for(let v=1;v<N;v++){const R=sec[v],out=[];for(let k=0;k<=KI;k++){const T=sub(R[Math.min(k+1,NU-1)],R[Math.max(k-1,0)]);const n1=cross(rdir(v-1,R[k]),T),n2=cross(rdir(v,R[k]),T);const c=Math.abs(dot(n1,n2))/(norm(n1)*norm(n2));out.push(deg(Math.acos(Math.min(1,c))));}seamFold[v]=out;}
 return{N,V:Vc,m,f,segs,rdir,shift,lines,kv,sec,seamFold,warns,half,halfT};
}

// ---------------------------------------------------------------- fig 8: hybrid forward loft (port of experiments/forward_loft.py)
const hermite=(p0,p1,m0,m1,x,L)=>{const t=x/L;return(2*t**3-3*t**2+1)*p0+(t**3-2*t**2+t)*L*m0+(-2*t**3+3*t**2)*p1+(t**3-t**2)*L*m1;};
const dhermite=(p0,p1,m0,m1,x,L)=>{const t=x/L;return((6*t**2-6*t)*p0+(3*t**2-4*t+1)*L*m0+(-6*t**2+6*t)*p1+(3*t**2-2*t)*L*m1)/L;};
class Chine{ // forward chine, t in [0,1]: t=0 at B, t=1 at the stem; x = xB(1-t)
 constructor(B,dy0,dz0,dyB,dzB){[this.xB,this.yB,this.zB]=V[B];this.dy0=dy0;this.dz0=dz0;this.dyB=dyB;this.dzB=dzB;}
 x(t){return this.xB*(1-t);}
 p(t){const x=this.x(t),L=this.xB;return[x,hermite(0,this.yB,this.dy0,this.dyB,x,L),hermite(V[0][2],this.zB,this.dz0,this.dzB,x,L)];}
 tan(t){const x=this.x(t),L=this.xB;return mul([1,dhermite(0,this.yB,this.dy0,this.dyB,x,L),dhermite(V[0][2],this.zB,this.dz0,this.dzB,x,L)],-this.xB);}
}
class Lower{ // composite lower curve, s in [0,2]: [0,1] seam B -> K_s (on the last cone's master frame), [1,2] keel K_s -> stem
 constructor(chain,B,kB,k0){this.ch=chain;this.B=B;this.xB=V[B][0];this.zK=chain.kv[B][2];this.kB=kB;this.k0=k0;}
 p(s){if(s<=1)return this.ch.half(1-s);const x=this.xB*(2-s);return[x,0,hermite(V[0][2],this.zK,this.k0,this.kB,x,this.xB)];}
 tan(s){if(s<=1)return mul(this.ch.halfT(1-s),-1);const x=this.xB*(2-s);return mul([1,0,dhermite(V[0][2],this.zK,this.k0,this.kB,x,this.xB)],-this.xB);}
}
function Fcop(low,ch,s,t){const a=unit(low.tan(s)),b=unit(ch.tan(t)),c=sub(ch.p(t),low.p(s)),n=norm(c);return n>1e-12?dot(a,cross(b,mul(c,1/n))):0;}
function rootsT(low,ch,s,nt=400){const out=[];let f0=Fcop(low,ch,s,0),fp=f0,tp=0;if(Math.abs(f0)<1e-9)out.push(0);
 for(let i=1;i<nt;i++){const t=i/(nt-1),f=Fcop(low,ch,s,t);if(fp*f<0){let a=tp,b=t,fa=fp;for(let k=0;k<45;k++){const m=(a+b)/2,fm=Fcop(low,ch,s,m);if(fa*fm<=0)b=m;else{a=m;fa=fm;}}out.push((a+b)/2);}fp=f;tp=t;}
 if(Math.abs(fp)<1e-9&&!(out.length&&out[out.length-1]>1-1e-6))out.push(1);return out;}
function trace(low,ch,ss,t0){const ts=[],all=[];let prev=t0;for(const s of ss){const r=rootsT(low,ch,s);all.push(r);if(!r.length){ts.push(NaN);continue;}let t=r[0];for(const q of r)if(Math.abs(q-prev)<Math.abs(t-prev))t=q;ts.push(t);prev=t;}return{ts,all};}
const foldDeg=n=>2*deg(Math.asin(Math.min(1,Math.abs(n[1])/norm(n))));
function regressionLambda(A,D){const out=[];for(let i=0;i<A.length-1;i++){const d1=D[i],d2=D[i+1],r=sub(A[i+1],A[i]);const a=dot(d1,d1),b=-dot(d1,d2),c=dot(d1,d2),d=-dot(d2,d2),det=a*d-b*c;out.push(Math.abs(det)<1e-12?NaN:(dot(r,d1)*d-b*dot(r,d2))/det);}return out;}
function matchedSlope(low,ch){const K=low.p(1);const gg=t=>{const c=sub(ch.p(t),K),T=ch.tan(t);return T[2]*c[0]-T[0]*c[2];};let tp=0.001,fp=gg(tp);
 for(let i=1;i<4000;i++){const t=0.001+0.998*i/3999,f=gg(t);if(fp*f<0){const c=sub(ch.p(tp),K);return{t:tp,slope:c[2]/c[0]};}tp=t;fp=f;}return null;}
function runHybrid(o){const B=2,ns=80;const aft=sub(V[B+1],V[B]);const dyB=aft[1]/aft[0],dzB=aft[2]/aft[0];
 const chain=coneChain(V,B,o.f,V[B][2]-o.drop,null,null);const q=chain.segs[B],zK=chain.kv[B][2];
 const aftKeel=q.cyl?q.dir[2]/q.dir[0]:(zK-q.P[2])/(V[B][0]-q.P[0]);
 const ch=new Chine(B,o.dy0,o.dz0,dyB,dzB);const m=matchedSlope(new Lower(chain,B,aftKeel,o.k0),ch);
 const kB=o.kB!==undefined?o.kB:(o.dk||0)+(m?m.slope:aftKeel);const low=new Lower(chain,B,kB,o.k0);
 const sSeam=[],sKeel=[];for(let i=0;i<ns;i++){sSeam.push(0.01+0.99*i/(ns-1));sKeel.push(1+1e-9+(0.99-1e-9)*i/(ns-1));}
 const S=trace(low,ch,sSeam,0),tS=S.ts[ns-1];const r1=rootsT(low,ch,sKeel[0]);let tK=NaN,kind,K;
 if(!r1.length){kind='no partner for the keel at K_s (infeasible)';K=trace(low,ch,sKeel,tS);}
 else{tK=r1[0];for(const t of r1)if(Math.abs(t-tS)<Math.abs(tK-tS))tK=t;K=trace(low,ch,sKeel,tK);kind=Math.abs(tK-tS)<0.01?'connected':(tK>tS?'fan at K_s':'crossing rulings (infeasible)');}
 const unpaired=K.ts.filter(t=>isNaN(t)).length;if(unpaired&&!/infeasible/.test(kind))kind+=' + '+unpaired+' keel samples unpaired (infeasible)';
 const mono=a=>{const b=a.filter(t=>!isNaN(t));for(let i=1;i<b.length;i++)if(b[i]-b[i-1]<-1e-6)return false;return true;};
 const okSeam=mono(S.ts),okKeel=mono(K.ts);if(!okKeel&&!/infeasible/.test(kind))kind+=' + keel pairing folds back (infeasible)';
 const Sall=sSeam.concat(sKeel),T=S.ts.concat(K.ts),A=[],D=[],Cc=[],good=[];
 for(let i=0;i<T.length;i++){if(isNaN(T[i]))continue;good.push(i);const a=low.p(Sall[i]),c=ch.p(T[i]);A.push(a);Cc.push(c);D.push(sub(c,a));}
 const lam=regressionLambda(A,D),inside=lam.filter(l=>l>1e-3&&l<1-1e-3).length;
 const keelFold=[],seamFold=[];
 for(let i=0;i<good.length;i++){const gi=good[i],s=Sall[gi];if(gi<ns){seamFold.push({s,deg:deg(Math.acos(Math.min(1,Math.abs(dot(unit(cross(chain.rdir(B,A[i]),low.tan(s))),unit(cross(D[i],low.tan(s))))))))});}
  else keelFold.push({x:A[i][0],deg:foldDeg(cross(D[i],low.tan(s)))});}
 const feasible=kind==='connected'&&unpaired===0&&okSeam&&okKeel&&inside===0;
 return{chain,ch,low,kB,aftKeel,matched:m,tS,tK,kind,feasible,unpaired,okSeam,okKeel,inside,lam,keelFold,seamFold,Sall,T,A,Cc,D,good,ns,allRoots:S.all.concat(K.all),B};}


// ---- cross-check against experiments/forward_loft.py (same cases as its __main__)
if(require.main===module){
 const base=runHybrid({dy0:0.45,dz0:-0.5,f:0.6,drop:0.35,k0:-0.35});
 console.log("matched slope",base.matched.slope.toFixed(3),"chord to chine x",base.ch.x(base.matched.t).toFixed(2),"  aft keel line",base.aftKeel.toFixed(3));
 const g1=runHybrid({dy0:0.45,dz0:-0.5,f:0.6,drop:0.35,kB:base.aftKeel,k0:-0.35});
 console.log("G1 keel:",g1.kind,"| seam branch ends at chine x",g1.ch.x(g1.tS).toFixed(2),", keel branch starts at x",isNaN(g1.tK)?"none":g1.ch.x(g1.tK).toFixed(2));
 for(const k0 of[-0.16,-0.2,-0.24,-0.26,-0.28,-0.30,-0.32,-0.34,-0.4,-0.5]){const r=runHybrid({dy0:0.45,dz0:-0.5,f:0.6,drop:0.35,dk:0,k0});
  const at=x=>{let b=null;for(const p of r.keelFold)if(!b||Math.abs(p.x-x)<Math.abs(b.x-x))b=p;return b?b.deg.toFixed(0):"-"};
  console.log("k0",k0.toFixed(2),(r.feasible?"FEASIBLE":"        "),r.kind.padEnd(52),"keel fold x=4/3/2/1:",at(4),at(3),at(2),at(1));}
}
module.exports={runHybrid,coneChain,Chine,Lower};
