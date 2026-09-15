import numpy as np
# smooth chine: quadratic-ish in y and z, bow at x=0, stem point on centreline
def chine(x):  # x in [0,10]
    y=1.3*np.sin(np.pi*x/10)**0.8 if x>0 else 0.0
    z=0.9-1.1*np.sin(np.pi*x/10)**0.9+0.05*x/10
    return np.array([x,y,z])
def run(nseg,NP=41,f=0.6,d=0.35):
    xs=np.linspace(0,10,nseg+1); V=np.array([chine(x) for x in xs]); N=nseg
    segs=[]
    for j in range(N):
        A,B=V[j],V[j+1]; dy=B[1]-A[1]
        segs.append((None,B-A) if abs(dy)<1e-12 else (A+(-A[1]/dy)*(B-A),None))
    def dirs(j,Q):
        P,dd=segs[j]; return (Q-P) if dd is None else np.broadcast_to(dd,Q.shape)
    def cut(j,Q,X):
        dd=dirs(j,Q); t=(X-Q[:,0])/dd[:,0]; return Q+t[:,None]*dd
    m=N//2; yc,zc,x=V[m][1],V[m][2],V[m][0]; zk=zc-d
    K=np.array([0,zk]);C=np.array([yc,zc]);mid=(K+C)/2;ctl=mid+f*(np.array([yc,zk])-mid)
    u=np.linspace(0,1,NP)[:,None]; h=(1-u)**2*K+2*u*(1-u)*ctl+u**2*C
    full=np.vstack([h[:0:-1]*[-1,1],h]); sec=[None]*(N+1)
    sec[m]=np.column_stack([np.full(len(full),x),full])
    for j in range(m,N): sec[j+1]=cut(j,sec[j],V[j+1][0])
    for j in range(m-1,-1,-1): sec[j]=cut(j,sec[j+1],V[j][0])
    folds=[]
    for v in range(1,N):
        R=sec[v]; T=np.gradient(R,axis=0)
        n1=np.cross(dirs(v-1,R),T); n2=np.cross(dirs(v,R),T)
        c=np.abs((n1*n2).sum(1))/np.linalg.norm(n1,axis=1)/np.linalg.norm(n2,axis=1)
        a=np.degrees(np.arccos(np.clip(c,-1,1))); folds.append(a[NP-1])  # fold at the keel point
    return np.array(folds)
for n in [4,8,16,32,64]:
    fo=run(n); print(f"{n:3d} segments: max keel fold per seam {fo.max():5.2f} deg, sum of folds {fo.sum():6.2f} deg")
