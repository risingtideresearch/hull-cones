"""Hybrid bottom: cone chain AFT of a transition chine vertex B, two-curve
developable loft FORWARD between a spline chine and a COMPOSITE lower curve
(seam on the last cone B->K_s, then the authored forward keel K_s->stem).

Pairing: coplanarity det(T_lower, T_chine, chord)=0, traced as t(s) on each piece
of the lower curve by bracketing + bisection in t.  The two pieces give two
branches; what happens where they meet the corner K_s decides feasibility:
  t_keel(K_s) == t_seam(K_s)  connected, no fan, zero keel fold at K_s
  t_keel(K_s)  > t_seam(K_s)  fan at K_s over that t-range (cone, apex K_s)
  t_keel(K_s)  < t_seam(K_s)  rulings cross -> no developable for this lower curve
numpy only.  Coordinates as in CLAUDE.md.  Run:  python3 experiments/forward_loft.py  (~5 min, pure-Python
bisection; import and call run(...) for a single case, ~10 s).
"""
import numpy as np
V=np.array([[0,0,0.9],[2.5,0.85,0.35],[5,1.3,0.1],[7.5,1.3,0.05],[10,0.9,0.15]],float)
N=len(V)-1
def unit(v): return v/np.linalg.norm(v)

# ---------------- aft cone chain (last cone only is needed here), master frame at B ------------
def seg(j):
    A,B=V[j],V[j+1]; dy=B[1]-A[1]
    if abs(dy)<1e-9: return None,(B-A)          # cylinder, rulings || B-A
    t=-A[1]/dy; return A+t*(B-A),None            # apex on centreplane
def rdir(j,Q):
    P,d=seg(j); return (Q-P) if d is None else d
def master_half(m,f,drop,u):
    """cubic Bezier half-section keel(u=0)->chine(u=1) at station of V[m], vertical plane (rake 0)."""
    x,yc,zc=V[m]; zk=zc-drop; dl=zc-zk
    K=np.array([0,0.]);C=np.array([yc,dl]);K1=np.array([0.55*f*yc,0]);C1=np.array([yc,dl-0.55*f*dl])
    u=np.atleast_1d(u)[:,None]; a,b,c,e=(1-u)**3,3*u*(1-u)**2,3*u*u*(1-u),u**3
    p=a*K+b*K1+c*C1+e*C
    return np.column_stack([np.full(len(p),x),p[:,0],zk+p[:,1]])
def master_tan(m,f,drop,u,h=1e-6):
    lo,hi=max(u-h,0),min(u+h,1); return (master_half(m,f,drop,hi)[0]-master_half(m,f,drop,lo)[0])/(hi-lo)

# ---------------- cubic Hermite helpers (parameter x on [0,L]) -------------------------------
def hermite(p0,p1,m0,m1,x,L):
    t=x/L; return (2*t**3-3*t**2+1)*p0+(t**3-2*t**2+t)*L*m0+(-2*t**3+3*t**2)*p1+(t**3-t**2)*L*m1
def dhermite(p0,p1,m0,m1,x,L):
    t=x/L; return ((6*t**2-6*t)*p0+(3*t**2-4*t+1)*L*m0+(-6*t**2+6*t)*p1+(3*t**2-2*t)*L*m1)/L

class Chine:
    """forward chine spline, t in [0,1]: t=0 at B, t=1 at stem V0; x = xB(1-t).
       y(x), z(x) cubic Hermite with slopes dy/dx, dz/dx at the stem (0) and at B."""
    def __init__(s,B,dy0,dz0,dyB,dzB):
        s.xB,s.yB,s.zB=V[B]; s.dy0,s.dz0,s.dyB,s.dzB=dy0,dz0,dyB,dzB
    def x(s,t): return s.xB*(1-t)
    def p(s,t):
        x=s.x(t); L=s.xB
        return np.array([x,hermite(0,s.yB,s.dy0,s.dyB,x,L),hermite(V[0][2],s.zB,s.dz0,s.dzB,x,L)])
    def tan(s,t):
        x=s.x(t); L=s.xB
        return -s.xB*np.array([1,dhermite(0,s.yB,s.dy0,s.dyB,x,L),dhermite(V[0][2],s.zB,s.dz0,s.dzB,x,L)])

class Lower:
    """composite lower curve, s in [0,2]: [0,1] seam from B down to K_s; [1,2] keel K_s -> stem.
       keel: Hermite z(x) in the centreplane, slope kB at K_s, k0 at the stem."""
    def __init__(s,B,f,drop,kB,k0):
        s.B,s.f,s.drop=B,f,drop; s.xB=V[B][0]; s.zK=V[B][2]-drop; s.kB,s.k0=kB,k0
    def p(s,sv):
        if sv<=1: return master_half(s.B,s.f,s.drop,1-sv)[0]
        x=s.xB*(2-sv); return np.array([x,0,hermite(V[0][2],s.zK,s.k0,s.kB,x,s.xB)])
    def tan(s,sv):   # one-sided at the corner: sv<=1 seam tangent, sv>1 keel tangent
        if sv<=1: return -master_tan(s.B,s.f,s.drop,1-sv)
        x=s.xB*(2-sv); return -s.xB*np.array([1,0,dhermite(V[0][2],s.zK,s.k0,s.kB,x,s.xB)])

def F(low,ch,sv,t):
    a=unit(low.tan(sv)); b=unit(ch.tan(t)); c=ch.p(t)-low.p(sv); n=np.linalg.norm(c)
    return float(np.dot(a,np.cross(b,c/n))) if n>1e-12 else 0.0

def roots_t(low,ch,sv,nt=400):
    ts=np.linspace(0,1,nt); fs=np.array([F(low,ch,sv,t) for t in ts]); out=[]
    if abs(fs[0])<1e-9: out.append(0.0)
    for i in range(nt-1):
        if fs[i]*fs[i+1]<0:
            a,b,fa=ts[i],ts[i+1],fs[i]
            for _ in range(45):
                m=(a+b)/2; fm=F(low,ch,sv,m)
                if fa*fm<=0: b=m
                else: a,fa=m,fm
            out.append((a+b)/2)
    if abs(fs[-1])<1e-9 and not (out and out[-1]>1-1e-6): out.append(1.0)
    return out

def trace(low,ch,ss,t_start):
    """follow the branch t(s) from t_start; pick the root nearest the previous t."""
    ts=[]; prev=t_start
    for sv in ss:
        r=roots_t(low,ch,sv)
        if not r: ts.append(np.nan); continue
        t=min(r,key=lambda t:abs(t-prev)); ts.append(t); prev=t
    return np.array(ts)

def fold_deg(n):  # angle between a tangent-plane normal and its mirror image = 2*deadrise
    return 2*np.degrees(np.arcsin(min(1,abs(n[1])/np.linalg.norm(n))))

def regression_lambda(A,D):
    """for consecutive rulings a+l*d, parameter l (0 lower curve, 1 chine) of closest approach."""
    out=[]
    for i in range(len(A)-1):
        a1,d1,a2,d2=A[i],D[i],A[i+1],D[i+1]
        M=np.array([[d1@d1,-d1@d2],[d1@d2,-d2@d2]]); rhs=np.array([(a2-a1)@d1,(a2-a1)@d2])
        try: out.append(np.linalg.solve(M,rhs)[0])
        except np.linalg.LinAlgError: out.append(np.nan)
    return np.array(out)

def matched_slope(low,ch):
    """keel slope at K_s that makes the keel branch start where the seam branch ends.
       seam tangent at K_s is || y (f>0), so the seam-side ruling at K_s goes to the chine
       point whose PROFILE tangent passes through K_s; the keel must leave K_s along that chord."""
    K=low.p(1.0)
    def g(t):
        c=ch.p(t)-K; T=ch.tan(t); return T[2]*c[0]-T[0]*c[2]
    tg=np.linspace(0.001,0.999,4000); gg=np.array([g(t) for t in tg]); idx=np.where(gg[:-1]*gg[1:]<0)[0]
    if not len(idx): return None
    t0=tg[idx[0]]; c=ch.p(t0)-K; return t0,c[2]/c[0]

def run(B=2,f=0.6,drop=0.35,dy0=0.45,dz0=-0.5,dyB=None,dzB=None,kB=None,k0=-0.35,ns=80,verbose=True,tag=''):
    aft=V[B+1]-V[B]
    if dyB is None: dyB=aft[1]/aft[0]
    if dzB is None: dzB=aft[2]/aft[0]
    P,d=seg(B); zK=V[B][2]-drop
    aft_keel=d[2]/d[0] if P is None else (zK-P[2])/(V[B][0]-P[0])   # slope of the aft keel line at K_s
    if kB is None: kB=aft_keel
    ch=Chine(B,dy0,dz0,dyB,dzB); low=Lower(B,f,drop,kB,k0)
    s_seam=np.linspace(0.01,1.0,ns); s_keel=np.linspace(1.0+1e-9,1.99,ns)
    t_seam=trace(low,ch,s_seam,0.0)
    # keel branch: root(s) in t at the keel side of the corner
    r1=roots_t(low,ch,s_keel[0]); tS=t_seam[-1]
    if not r1:
        kind='NO PARTNER for keel at K_s (infeasible)'; tK=np.nan
        t_keel=trace(low,ch,s_keel,tS)
    else:
        tK=min(r1,key=lambda t:abs(t-tS)); t_keel=trace(low,ch,s_keel,tK)
        kind='connected' if abs(tK-tS)<0.01 else ('fan at K_s' if tK>tS else 'CROSSING (infeasible)')
    unpaired=int(np.isnan(t_keel).sum())
    if unpaired and 'infeasible' not in kind: kind+=f' + {unpaired} keel samples unpaired (infeasible)'
    ok_seam=np.all(np.diff(t_seam[~np.isnan(t_seam)])>-1e-6); ok_keel=np.all(np.diff(t_keel[~np.isnan(t_keel)])>-1e-6)
    if not ok_keel and 'infeasible' not in kind: kind+=' + keel pairing folds back (infeasible)'
    gap=tK-tS
    # rulings
    S_all=np.concatenate([s_seam,s_keel]); T=np.concatenate([t_seam,t_keel]); good=~np.isnan(T)
    A=np.array([low.p(s) for s in S_all[good]]); Cc=np.array([ch.p(t) for t in T[good]]); D=Cc-A
    lam=regression_lambda(A,D); inside=((lam>1e-3)&(lam<1-1e-3)).sum()
    # folds
    nsg=int(good[:ns].sum()); keel_fold=np.array([(low.p(s)[0],fold_deg(np.cross(D[nsg+i],low.tan(s)))) for i,s in enumerate(s_keel[good[ns:]])])
    fan_fold=None
    if r1 and gap>0.01:
        ffan=lambda t:fold_deg(np.cross(ch.p(t)-low.p(1.0),ch.tan(t))); fan_fold=(ffan(tS),ffan(tK))
    seam_fold=np.array([np.degrees(np.arccos(min(1,abs(np.dot(unit(np.cross(rdir(B,low.p(s)),low.tan(s))),unit(np.cross(D[i],low.tan(s)))))))) for i,s in enumerate(s_seam[:-1]) if good[i]])
    m=matched_slope(low,ch)
    res=dict(kind=kind,gap=gap,tS=tS,tK=tK,xS=ch.x(tS),xK=ch.x(tK),ok_seam=ok_seam,ok_keel=ok_keel,inside=inside,lam=lam,unpaired=unpaired,
             keel_fold=keel_fold,fan_fold=fan_fold,seam_fold=seam_fold,matched=m,aft_keel=aft_keel,kB=kB,ch=ch,low=low,A=A,D=D,T=T,t_seam=t_seam,s_seam=s_seam)
    if verbose:
        print(f"--- {tag}B=V{B} f={f} drop={drop} chine stem slopes dy={dy0} dz={dz0}; at B dy={dyB:.3f} dz={dzB:.3f}; keel slope at K_s {kB:.3f} (aft keel line {aft_keel:.3f}), at stem {k0}")
        print(f"  seam branch ends at chine x={ch.x(tS):.2f}; keel branch starts at chine x={ch.x(tK):.2f}  ->  {kind}")
        print(f"  monotone: seam {ok_seam}, keel {ok_keel}; keel samples with no partner {unpaired}/{ns}; regression point inside panel for {inside} of {len(lam)} ruling pairs (lambda in (0,1): {np.round(lam[(lam>1e-3)&(lam<1-1e-3)],3)})")
        if fan_fold: print(f"  fan at K_s spans chine x {ch.x(tS):.2f}..{ch.x(tK):.2f}; fold across the fan 0 -> {fan_fold[1]:.1f} deg (seam side -> keel side)")
        kf=keel_fold
        if len(kf): print(f"  forward keel fold: at K_s {kf[0,1]:.1f} deg, x=4 {np.interp(4,kf[::-1,0],kf[::-1,1]):.1f}, x=3 {np.interp(3,kf[::-1,0],kf[::-1,1]):.1f}, x=2 {np.interp(2,kf[::-1,0],kf[::-1,1]):.1f}, x=1 {np.interp(1,kf[::-1,0],kf[::-1,1]):.1f}, max {kf[:,1].max():.1f} at x={kf[kf[:,1].argmax(),0]:.2f}")
        print(f"  seam B fold (aft cone vs forward panel): {seam_fold.min():.1f}..{seam_fold.max():.1f} deg")
        if m: print(f"  matched keel slope at K_s = {m[1]:.3f} (chord to chine x={ch.x(m[0]):.2f}); keel knuckle at K_s vs aft keel line {np.degrees(np.arctan(m[1])-np.arctan(aft_keel)):.1f} deg")
        else: print("  no chine point has its profile tangent through K_s: seam-side ruling at K_s does not exist")
    return res

if __name__=="__main__":
    print("=== baseline: transition at V2, keel continued G1 from the aft cylinder ==="); base=run()
    km=base['matched'][1]
    print("\n=== keel slope at K_s = matched value ==="); run(kB=km,tag='')
    print("\n=== scan of keel slope at K_s around the matched value ===")
    for dk in [0.08,0.04,0.02,0.01,0.0,-0.01,-0.02,-0.04,-0.08,-0.15]:
        r=run(kB=km+dk,verbose=False)
        print(f"  kB={km+dk:+.3f} (matched{dk:+.2f}): {r['kind']:60s} fold at K_s {r['keel_fold'][0,1] if len(r['keel_fold']) else float('nan'):5.1f} deg" + (f", fan over chine x {r['xS']:.2f}..{r['xK']:.2f}" if r['fan_fold'] else ''))
    print("\n=== keel slope at K_s matched; scan the STEM keel slope k0 (keel curvature) ===")
    for k0 in [-0.16,-0.18,-0.2,-0.22,-0.24,-0.26,-0.28,-0.30,-0.32,-0.34,-0.4,-0.5]:
        r=run(kB=km,k0=k0,verbose=False); kf=r['keel_fold']
        prof="  ".join(f"x={x}: z={np.interp(x,r['low'].p(1.0)[0]*np.array([0,1]),[V[0][2],r['low'].zK]) if False else hermite(V[0][2],r['low'].zK,k0,km,x,r['low'].xB):.2f} fold={np.interp(x,kf[::-1,0],kf[::-1,1]):.0f}" for x in [4,3,2,1])
        print(f"  k0={k0:+.2f}: {r['kind']:52s} {prof}")
    print("\n=== sweep: matched slope vs drop, fullness, stem profile slope (B=V2) ===")
    for kw in [dict(drop=0.2),dict(drop=0.5),dict(f=0.3),dict(f=0.9),dict(dz0=-0.25),dict(dz0=-0.8),dict(dy0=0.25)]:
        r=run(verbose=False,**kw); m=r['matched']
        print(f"  {str(kw):18s} matched slope {m[1]:.3f} (chord to chine x={r['ch'].x(m[0]):.2f}) vs aft keel {r['aft_keel']:.3f}; G1 keel -> {r['kind']}")
    print("\n=== transition at V1 (aft: 3 cones, master at V1): G1 keel, then matched slope with a few k0 ==="); r=run(B=1)
    for k0 in [-0.3,-0.4,-0.5,-0.6,-0.8]:
        q=run(B=1,kB=r['matched'][1],k0=k0,verbose=False); print(f"  k0={k0:+.2f}: {q['kind']}")

