import numpy as np
V=np.array([[0,0,0.9],[2.5,0.85,0.35],[5,1.3,0.1],[7.5,1.3,0.05],[10,0.9,0.15]],float)
N=len(V)-1
def seg(j):
    A,B=V[j],V[j+1]; dy=B[1]-A[1]
    if abs(dy)<1e-9: return None,(B-A)
    t=-A[1]/dy; return A+t*(B-A),None
S=[seg(j) for j in range(N)]
def dirs(j,Q):
    P,d=S[j]; return (Q-P) if d is None else np.broadcast_to(d,Q.shape)
def cut(j,Q,B,theta):  # move points Q along cone-j rulings to plane thru B, normal rotated theta about y
    n=np.array([np.cos(theta),0,np.sin(theta)]); d=dirs(j,Q)
    t=((B-Q)@n)/(d@n); return Q+t[:,None]*d
def master(m,f,d,NP=41):
    yc,zc,x=V[m][1],V[m][2],V[m][0]; zk=zc-d
    K=np.array([0,zk]);C=np.array([yc,zc]);mid=(K+C)/2;ctl=mid+f*(np.array([yc,zk])-mid)
    u=np.linspace(0,1,NP)[:,None]; h=(1-u)**2*K+2*u*(1-u)*ctl+u**2*C
    full=np.vstack([h[:0:-1]*[-1,1],h]); return np.column_stack([np.full(len(full),x),full])
def build(m,f,d,tilt):
    sec=[None]*(N+1); sec[m]=master(m,f,d)
    for j in range(m,N): sec[j+1]=cut(j,sec[j],V[j+1],tilt[j+1])
    for j in range(m-1,-1,-1): sec[j]=cut(j,sec[j+1],V[j],tilt[j])
    return sec
def fold(sec,v):
    R=sec[v]; T=np.gradient(R,axis=0)
    n1=np.cross(dirs(v-1,R),T); n2=np.cross(dirs(v,R),T)
    c=np.abs((n1*n2).sum(1))/np.linalg.norm(n1,axis=1)/np.linalg.norm(n2,axis=1)
    return np.degrees(np.arccos(np.clip(c,-1,1)))
m,f,d=2,0.6,0.35
for v in [1,3]:
    print("seam at V%d"%v)
    for th in np.radians([-40,-20,0,20,40]):
        tilt=[0]*(N+1); tilt[v]=th
        a=fold(build(m,f,d,tilt),v)
        print("  tilt %5.0f deg: fold min %.1f max %.1f at centreline %.1f"%(np.degrees(th),a.min(),a.max(),a[len(a)//2]))
