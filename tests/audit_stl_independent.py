import struct,glob,os,collections
import numpy as np
def load(p):
    d=open(p,'rb').read()
    if d[:5]==b'solid' and b'facet' in d[:1000]: return None,None,'ascii'
    n=struct.unpack('<I',d[80:84])[0]
    m=(len(d)-84)//50
    ok = (m==n)
    n=min(n,m)
    a=np.frombuffer(d[84:84+50*n],dtype=np.uint8).reshape(n,50)
    v=a[:,12:48].copy().view('<f4').reshape(n,3,3).astype(float)
    nm=a[:,0:12].copy().view('<f4').reshape(n,3).astype(float)
    return v,nm,('ok' if ok else 'TRUNC')
def comps(v):
    em=collections.defaultdict(list)
    for i,t in enumerate(v):
        k=[tuple(round(float(x),4) for x in p) for p in t]
        for j in range(3): em[tuple(sorted((k[j],k[(j+1)%3])))].append(i)
    par=list(range(len(v)))
    def f(x):
        while par[x]!=x: par[x]=par[par[x]]; x=par[x]
        return x
    for o in em.values():
        for b in o[1:]:
            a,b2=f(o[0]),f(b)
            if a!=b2: par[b2]=a
    g=collections.defaultdict(list)
    for i in range(len(v)): g[f(i)].append(i)
    return list(g.values()), sum(1 for c in em.values() if len(c)!=2)
def xsec(t,n,z):
    segs=[]
    for tri,nn in zip(t,n):
        d=tri[:,2]-z; s=np.sign(d)
        if (s>0).all() or (s<0).all(): continue
        pts=[]
        for i in range(3):
            a,b=tri[i],tri[(i+1)%3]; da,db=d[i],d[(i+1)%3]
            if abs(da)<1e-9: pts.append(a[:2])
            if da*db<0: pts.append((a+(b-a)*(da/(da-db)))[:2])
        keep=[]
        for p in pts:
            if all(np.linalg.norm(p-q)>1e-7 for q in keep): keep.append(p)
        if len(keep)!=2: continue
        a,b=keep; dv=np.array([-nn[1],nn[0]])
        if np.dot(b-a,dv)<0: a,b=b,a
        segs.append((a,b))
    return segs
def area(s): return abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in s))/2
def samp(s,st=0.3):
    P=[]
    for a,b in s:
        L=np.linalg.norm(b-a); k=max(1,int(L/st))
        for i in range(k): P.append(a+(b-a)*i/k)
    return np.array(P) if P else np.zeros((0,2))
def mingap(pp,cell=5.0):
    g=collections.defaultdict(list)
    for i,P in enumerate(pp):
        for p in P: g[(int(p[0]//cell),int(p[1]//cell))].append((i,p))
    best=1e9
    for (cx,cy),items in g.items():
        near=[]
        for dx in(-1,0,1):
            for dy in(-1,0,1): near+=g.get((cx+dx,cy+dy),[])
        A=np.array([p for _,p in items]); ia=np.array([i for i,_ in items])
        B=np.array([p for _,p in near]);  ib=np.array([i for i,_ in near])
        D=np.linalg.norm(A[:,None]-B[None],axis=2)
        D=np.where(ia[:,None]!=ib[None,:],D,1e9)
        best=min(best,D.min())
        if best<0.01: break
    return best
print(f"{'file':40s} {'tri':>7s} {'hdr':>6s} {'panels':>7s} {'badE':>6s} {'bbox XY':>17s} {'Z':>6s} {'minGap':>7s} {'minPanel':>9s}")
for p in sorted(glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'examples', '*', '*_PRINT_0p8mm.stl'))):
    v,nm,st=load(p)
    cs,bad=comps(v)
    pts=v.reshape(-1,3); mn=pts.min(0); mx=pts.max(0)
    zmid=(mn[2]+mx[2])/2
    ar=[];pp=[]
    for c in cs:
        s=xsec(v[c],nm[c],mn[2]+0.1)
        ar.append(area(s)); pp.append(samp(s))
    ar=np.array(ar)
    g=mingap([q for q in pp if len(q)]) if len(pp)>1 else 0
    print(f"{os.path.basename(p)[:38]:40s} {len(v):7d} {st:>6s} {len(cs):7d} {bad:6d} "
          f"{mx[0]-mn[0]:7.1f}x{mx[1]-mn[1]:7.1f} {mx[2]-mn[2]:6.2f} {g:7.2f} {ar.min():9.2f}")
