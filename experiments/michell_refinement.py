"""Michell thin-ship wave resistance of the cone-chain bottom under a SMOOTH test chine cut
into N segments (N = 2..256), same set-up as refine_polyline_chine.py, to answer: does
refining the chain (more, smaller creases) raise or lower the wave drag?

Michell (1898), Tuck's form:  R = 4 rho g^2/(pi U^2) * Int_1^inf |A(l)|^2 l^2/sqrt(l^2-1) dl
  A(l) = IntInt_S  dy/dx(x,z) exp(k l^2 z) exp(i k l x) dz dx,  k = g/U^2,  z <= 0 below the
  free surface, y = starboard offset of the centreplane-symmetric hull.
Substitution l = cosh t removes the end-point singularity: l^2/sqrt(l^2-1) dl = cosh^2 t dt.

Hull below the waterline z_wl: cone-chain bottom (master frame at the middle vertex, drop 0.35,
round-bilge cubic frame equivalent to fullness 0.6), vertical topsides from the chine up to the
waterline (identical for every N, since the chine is interpolated at the vertices).
Both ends of the test chine are on the centreline, so there is no transom step (which would make
Michell's integral diverge logarithmically). numpy only, ~20 s.
"""
import numpy as np
g,rho,L=9.81,1025.0,10.0
Z_WL=0.30; DROP=0.35; NP=41
def chine(x):
    s=np.sin(np.pi*x/10)
    return np.array([x,1.3*s**0.8 if 0<x<10 else 0.0,0.9-1.1*max(s,0)**0.9+0.05*x/10])
def bezier_half(yc,dl,thK,aK,thC,aC,NP):
    """cubic from keel (0,0) to chine (yc,dl) in the frame plane; tangent angles from the
    across-axis, handle lengths as fractions of the chord. Returns keel->chine."""
    Lc=np.hypot(yc,dl); K=np.zeros(2); C=np.array([yc,dl])
    K1=K+aK*Lc*np.array([np.cos(thK),np.sin(thK)]); C1=C-aC*Lc*np.array([np.cos(thC),np.sin(thC)])
    u=np.linspace(0,1,NP)[:,None]
    return (1-u)**3*K+3*u*(1-u)**2*K1+3*u*u*(1-u)*C1+u**3*C
def frame_round_bilge(yc,dl,f=0.6):   # same curve as the pages' fullness parameter
    Lc=np.hypot(yc,dl); return bezier_half(yc,dl,0.0,0.55*f*yc/Lc,np.pi/2,0.55*f*dl/Lc,NP)
def sections(nseg,xs):
    """starboard half-sections (chine k=0 .. keel k=NP-1) of the N-cone chain at stations xs"""
    V=np.array([chine(x) for x in np.linspace(0,10,nseg+1)]); N=nseg
    segs=[]
    for j in range(N):
        A,B=V[j],V[j+1]; dy=B[1]-A[1]
        segs.append((None,B-A) if abs(dy)<1e-12 else (A+(-A[1]/dy)*(B-A),None))
    def dirs(j,Q):
        P,dd=segs[j]; return (Q-P) if dd is None else np.broadcast_to(dd,Q.shape)
    def cut(j,Q,X):
        dd=dirs(j,Q); t=(X-Q[:,0])/dd[:,0]; return Q+t[:,None]*dd
    m=N//2; x,yc,zc=V[m]; zk=zc-DROP
    h=frame_round_bilge(yc,zc-zk)[::-1]          # chine -> keel
    sec=[None]*(N+1); sec[m]=np.column_stack([np.full(NP,x),h[:,0],zk+h[:,1]])
    for j in range(m,N): sec[j+1]=cut(j,sec[j],V[j+1][0])
    for j in range(m-1,-1,-1): sec[j]=cut(j,sec[j+1],V[j][0])
    out=np.zeros((len(xs),NP,3))
    for i,X in enumerate(xs):
        j=min(N-1,int(np.searchsorted(V[:,0],X,side='right')-1))
        src=sec[j] if abs(V[j][1])>1e-9 else sec[j+1]      # a non-degenerate section on cone j
        out[i]=cut(j,src,X)
    return out,V
def offsets(sec,zs):
    """y(x,z) on the z grid: frame between keel and chine, vertical topside chine->waterline"""
    nx=sec.shape[0]; Y=np.zeros((nx,len(zs)))
    for i in range(nx):
        zk,zc,yc=sec[i,-1,2],sec[i,0,2],sec[i,0,1]
        zz=sec[i,::-1,2]; yy=sec[i,::-1,1]           # keel -> chine, z increasing
        Y[i]=np.where(zs<zk,0.0,np.where(zs<=zc,np.interp(zs,zz,yy),yc))
    return Y
def michell(xs,zs,Y,U,nt=500,lmax=40.0):
    k=g/U**2; dx=xs[1]-xs[0]; dz=zs[1]-zs[0]
    Yx=np.gradient(Y,dx,axis=0); zr=zs-Z_WL          # z measured from the free surface (<=0)
    t=np.linspace(0,np.arccosh(lmax),nt); lam=np.cosh(t)
    A=np.array([np.sum(Yx*np.exp(k*l*l*zr)[None,:]*np.exp(1j*k*l*xs)[:,None])*dx*dz for l in lam])
    return 4*rho*g*g/(np.pi*U*U)*np.trapezoid(np.abs(A)**2*np.cosh(t)**2,t)
if __name__=="__main__":
    xs=np.linspace(0,10,801); zs=None; Ns=[2,4,8,16,32,64,256]; Frs=[0.20,0.25,0.30,0.35,0.40,0.50]
    secs={}; zmin=1e9
    for N in Ns:
        s,V=sections(N,xs); secs[N]=s; zmin=min(zmin,s[:,-1,2].min())
    zs=np.linspace(zmin-0.01,Z_WL,90)
    Ys={N:offsets(secs[N],zs) for N in Ns}
    print("wetted half-area (m^2) per N:",{N:round(float(np.trapezoid(np.trapezoid(np.ones_like(Ys[N])*(Ys[N]>0),zs,axis=1),xs)),3) for N in Ns})
    print("max |offset difference| to N=256 (m):",{N:round(float(np.abs(Ys[N]-Ys[256]).max()),4) for N in Ns})
    print("\nMichell wave resistance R_w [N] (rows: N segments; columns: Froude number), and ratio to N=256")
    print("   N  "+"".join(f"{Fr:>12.2f}" for Fr in Frs))
    R={}
    for N in Ns:
        R[N]=[michell(xs,zs,Ys[N],Fr*np.sqrt(g*L)) for Fr in Frs]
        print(f"{N:4d}  "+"".join(f"{r:12.1f}" for r in R[N]))
    print("ratio R_w(N)/R_w(256):")
    for N in Ns[:-1]:
        print(f"{N:4d}  "+"".join(f"{R[N][i]/R[256][i]:12.3f}" for i in range(len(Frs))))
    # grid check at Fr 0.35 for N=8
    xs2=np.linspace(0,10,1601); s2,_=sections(8,xs2); zs2=np.linspace(zmin-0.01,Z_WL,180)
    print("\ngrid check N=8, Fr=0.35: coarse",round(R[8][3],2),"fine",round(michell(xs2,zs2,offsets(s2,zs2),0.35*np.sqrt(g*L)),2))
