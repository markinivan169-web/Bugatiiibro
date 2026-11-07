import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { ComponentId } from '../data/components';

export interface VehiclePart { group:T.Group; id:ComponentId; origin:T.Vector3; offset:T.Vector3; rotation:T.Vector3; start:number; radius:number; materials:T.MeshStandardMaterial[]; }
type V = [number,number,number];
const metal = (color:string, roughness=.28, metalness=.75) => new T.MeshStandardMaterial({color,roughness,metalness});
function surface(fn:(u:number,v:number)=>V,nu=48,nv=20) {
  const positions:number[]=[],indices:number[]=[];
  for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++)positions.push(...fn(i/nu,j/nv));
  for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const a=i*(nv+1)+j,b=a+nv+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function tube(points:V[],radius=.015,closed=false){return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),closed),Math.max(24,points.length*6),radius,6,closed);}
export function buildVehicle(){
  const root=new T.Group(),parts:VehiclePart[]=[];
  const paint=new T.MeshPhysicalMaterial({color:'#8daab8',metalness:.86,roughness:.23,clearcoat:1,clearcoatRoughness:.16,side:T.DoubleSide});
  const navy=metal('#142939',.27,.8);navy.side=T.DoubleSide;
  const carbon=metal('#13181c',.48,.35),silver=metal('#acb7bd',.23,.95),dark=metal('#090c10',.62,.1),rubber=metal('#131517',.87,0),leather=metal('#8a5e42',.8,.05),red=metal('#a83225',.35,.55),gold=metal('#9f8353',.3,.8);
  const glass=new T.MeshPhysicalMaterial({color:'#101d27',metalness:.45,roughness:.12,clearcoat:1,side:T.DoubleSide});
  const white=new T.MeshStandardMaterial({color:'#e4f5ff',emissive:'#bddfff',emissiveIntensity:3,toneMapped:false});
  const rearLight=new T.MeshStandardMaterial({color:'#ff332a',emissive:'#ff2015',emissiveIntensity:2,toneMapped:false});
  let current:T.Group;
  const part=(id:ComponentId,name:string,offset:V,start:number,rotation:V=[0,0,0])=>{current=new T.Group();current.name=name;root.add(current);parts.push({group:current,id,origin:new T.Vector3(),offset:new T.Vector3(...offset),rotation:new T.Vector3(...rotation),start,radius:1,materials:[]});};
  const mesh=(geometry:T.BufferGeometry,material:T.Material,pos:V=[0,0,0],rot:V=[0,0,0])=>{const m=new T.Mesh(geometry,material);m.position.set(...pos);m.rotation.set(...rot);current.add(m);return m;};
  const box=(size:V,pos:V,mat:T.Material,rot:V=[0,0,0])=>mesh(new T.BoxGeometry(...size),mat,pos,rot);
  const cyl=(r:number,h:number,pos:V,mat:T.Material,rot:V=[Math.PI/2,0,0])=>mesh(new T.CylinderGeometry(r,r,h,32),mat,pos,rot);
  const rod=(a:V,b:V,r:number,mat:T.Material)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);const m=mesh(new T.CylinderGeometry(r,r,d.length(),8),mat,av.clone().add(bv).multiplyScalar(.5).toArray() as V);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());};
  const width=(x:number)=>.78+.18*Math.exp(-(((x+1.4)/.66)**2))+.22*Math.exp(-(((x-1.35)/.8)**2));
  const fender=(x:number)=>.21*Math.exp(-(((x+1.4)/.5)**2))+.23*Math.exp(-(((x-1.35)/.6)**2));
  // Longitudinal, curved panels with actual wheel-arch openings.
  for(const s of [-1,1]){
    part('body',s<0?'Left sculpted flank':'Right sculpted flank',[0,.65,s*1.55],.37,[s*.07,0,s*.05]);
    mesh(surface((u,v)=>{const x=-2.3+4.6*u;const z=s*width(x)*(.65+.35*Math.sin(v*Math.PI/2));let low=.25;for(const wx of [-1.4,1.35])if(Math.abs(x-wx)<.52)low=Math.max(low,.44+Math.sqrt(.52**2-(x-wx)**2));const high=.73+fender(x);return [x,high*(1-v)+Math.min(high-.03,low)*v,z];}),s>0?paint:navy);
    mesh(tube([[-.8,.48,s*.9],[-.65,.29,s*.93],[.62,.3,s*.94],[1.04,.7,s*.98],[.65,1.02,s*.86],[.15,1.18,s*.66],[-.48,1.15,s*.65]],.025),silver);
    box([1.1,.28,.04],[.3,.55,s*.91],dark,[0,s*.1,0]);
    box([1.65,.08,.10],[0,.25,s*.97],carbon);
    rod([-.6,.94,s*.7],[-.68,.91,s*1.07],.022,carbon);
    const mirror=mesh(new T.SphereGeometry(1,20,10),paint,[-.7,.94,s*1.1]);mirror.scale.set(.15,.055,.085);
  }
  part('hood','Front bonnet',[-1.05,1.65,0],.39,[0,0,-.12]);
  mesh(surface((u,v)=>{const x=-2.29+1.5*u,z=(v*2-1)*width(x)*.72;return [x,.72+.07*Math.sin(u*Math.PI)+fender(x)*Math.abs(v*2-1),z];}),paint);
  mesh(tube([[-2.27,.745,0],[-1.8,.81,0],[-1.3,.82,0],[-.8,.77,0]],.009),silver);
  for(const s of [-1,1])mesh(tube([[-2,.77,s*.37],[-1.55,.82,s*.43],[-1,.81,s*.55]],.018),dark);
  part('body','Rear engine cover',[.85,1.9,0],.44,[0,0,.14]);
  mesh(surface((u,v)=>{const x=.58+1.73*u,z=(v*2-1)*width(x)*.76;return [x,.82+.12*Math.sin(u*Math.PI)+fender(x)*Math.abs(v*2-1),z];}),navy);
  for(const s of [-1,1])for(let i=0;i<9;i++)box([.035,.018,.25],[.88+i*.12,.94,s*.39],carbon,[0,0,-.12]);
  part('body','Roof and glass canopy',[0,2.35,0],.43,[0,0,.04]);
  mesh(surface((u,v)=>{const x=-.92+1.83*u;const arch=Math.sin(Math.PI*u);const z=(v*2-1)*(.55+.08*arch);return [x,.81+.47*arch*(1-.23*(v*2-1)**2),z];}),glass, [0,0,0]);
  mesh(surface((u,v)=>{const x=-.31+.8*u,z=(v*2-1)*.53;return [x,1.26-.045*(v*2-1)**2-.03*Math.abs(u-.4),z];},24,12),paint);
  for(const s of [-1,1])mesh(tube([[-.94,.82,s*.55],[-.48,1.17,s*.63],[.02,1.24,s*.64],[.5,1.13,s*.62],[.9,.82,s*.55]],.025),silver);
  for(const s of [-1,1])mesh(surface((u,v)=>{const x=-.88+1.73*u,top=.82+.41*Math.sin(Math.PI*u);return [x,.81+(top-.81)*v,s*(.65-.035*v)];},32,10),glass);
  part('hood','Horseshoe front fascia',[-1.45,.35,0],.45,[0,.06,0]);
  // Recessed horseshoe opening and flying-fender intake lips.
  const shape=new T.Shape();shape.moveTo(-.25,-.17);shape.lineTo(.25,-.17);shape.lineTo(.28,.1);shape.bezierCurveTo(.28,.38,-.28,.38,-.28,.1);shape.closePath();
  const grille=mesh(new T.ShapeGeometry(shape),dark,[-2.34,.45,0],[0,-Math.PI/2,0]);grille.scale.set(1,1,1);
  mesh(tube([[-2.36,.28,-.25],[-2.36,.55,-.29],[-2.36,.73,0],[-2.36,.55,.29],[-2.36,.28,.25]],.024),silver);
  for(let i=-4;i<=4;i++)rod([-2.365,.32,i*.048],[-2.365,.57,i*.048],.004,silver);
  for(const s of [-1,1]){box([.15,.19,.46],[-2.15,.48,s*.63],dark);mesh(tube([[-2.32,.68,s*.35],[-2.28,.69,s*.7],[-2.12,.74,s*.91]],.032),paint);}
  part('optics','Front light units',[-1.7,.9,0],.48);
  for(const s of [-1,1]){box([.11,.07,.5],[-2.21,.75,s*.65],dark);for(let i=0;i<4;i++)box([.025,.025,.073],[-2.277,.767,s*(.46+i*.11)],white);}
  part('optics','Rear light bar',[1.7,.85,0],.49);
  mesh(tube([[2.32,.65,-.91],[2.39,.72,-.61],[2.41,.73,0],[2.39,.72,.61],[2.32,.65,.91]],.018),rearLight);
  part('aero','Front splitter',[-1.15,-.3,0],.5);
  mesh(surface((u,v)=>[-2.43+.58*u,.23-.06*Math.sin(u*Math.PI),(v*2-1)*(1.03-.1*u)],16,8),carbon);
  part('aero','Rear wing and diffuser',[1.45,.2,0],.54,[0,0,.1]);
  box([.3,.045,1.85],[2.04,.96,0],carbon,[0,0,.07]);
  for(const s of [-1,1])box([.08,.19,.04],[2.04,.86,s*.6],silver);
  box([.6,.08,1.7],[2.12,.25,0],carbon,[0,0,.15]);
  for(let i=-3;i<=3;i++)box([.5,.16,.025],[2.1,.24,i*.22],carbon,[0,0,.15]);
  for(const s of [-1,1])cyl(.065,.22,[2.33,.36,s*.38],silver,[0,0,Math.PI/2]);
  part('chassis','Central carbon monocoque',[0,-.18,0],.58);
  box([3.65,.12,1.43],[0,.24,0],carbon);
  for(const s of [-1,1]){box([1.6,.26,.15],[-.1,.38,s*.69],carbon);rod([-1.65,.34,s*.6],[1.67,.34,s*.6],.05,carbon);}
  box([.11,.47,1.33],[.61,.48,0],carbon);
  part('battery','Structural battery',[0,-.85,0],.57);
  box([1.8,.2,.28],[-.2,.39,0],silver);box([.33,.45,1.1],[.58,.53,0],dark);
  for(let i=0;i<10;i++)box([.015,.205,.285],[-1+i*.16,.39,0],gold);
  part('powertrain','V16 combustion engine',[1.05,1.15,0],.53,[0,0,-.12]);
  box([1.12,.32,.52],[1.15,.55,0],silver);
  for(const s of [-1,1]){
    box([1.18,.18,.26],[1.14,.79,s*.22],carbon,[s*.45,0,0]);
    for(let i=0;i<8;i++){const x=.64+i*.145;cyl(.065,.2,[x,.72,s*.24],silver,[s*.55,0,0]);mesh(tube([[x,.6,s*.29],[x,.5,s*.49],[x+.12,.37,s*.5]],.028),silver);}
    box([.9,.022,.04],[1.16,.9,s*.25],gold);
  }
  box([1,.09,.15],[1.15,.86,0],silver);for(let i=0;i<8;i++)box([.025,.04,.13],[.72+i*.12,.925,0],dark);
  part('transmission','Longitudinal gearbox',[2.15,-.1,0],.56,[0,0,.2]);
  cyl(.2,.65,[1.98,.48,0],silver,[0,0,Math.PI/2]);box([.45,.28,.33],[2.05,.5,0],silver);
  for(let i=0;i<7;i++)cyl(.205,.015,[1.77+i*.075,.48,0],carbon,[0,0,Math.PI/2]);
  for(const x of [-1.4,1.35])for(const s of [-1,1]){
    part('suspension',`${x<0?'Front':'Rear'} ${s<0?'left':'right'} suspension`,[x<0?-.25:.25,.12,s*.9],.5);
    for(const y of [.31,.61]){rod([x-.31,y,s*.44],[x,y+.02,s*.91],.026,silver);rod([x+.31,y,s*.44],[x,y+.02,s*.91],.026,silver);}
    rod([x,.28,s*.87],[x+.15,.76,s*.52],.045,gold);
    const coil:V[]=[];for(let i=0;i<=80;i++){const t=i/80;coil.push([x+.15*t+.062*Math.cos(t*Math.PI*14),.3+.43*t,s*(.85-.29*t)+.062*Math.sin(t*Math.PI*14)]);}mesh(tube(coil,.012),silver);
    part('brakes',`${x<0?'Front':'Rear'} ${s<0?'left':'right'} brake`,[0,.1,s*1.23],.47);
    cyl(.29,.035,[x,.45,s*.96],carbon);cyl(.12,.055,[x,.45,s*.96],silver);
    for(let i=0;i<16;i++){const a=i*Math.PI/8;cyl(.013,.04,[x+Math.cos(a)*.225,.45+Math.sin(a)*.225,s*.982],dark);}
    box([.13,.3,.08],[x+.22,.46,s*.99],red,[0,0,.15]);
    part('wheels',`${x<0?'Front':'Rear'} ${s<0?'left':'right'} wheel`,[x<0?-.22:.22,.12,s*1.85],.3,[0,s*.08,0]);
    mesh(new T.TorusGeometry(.372,.105,12,48),rubber,[x,.45,s*1.02]);
    cyl(.33,.21,[x,.45,s*1.02],dark);
    for(const depth of [-.105,.105])mesh(new T.TorusGeometry(.32,.017,6,48),silver,[x,.45,s*1.02+depth]);
    for(let i=0;i<10;i++){const a=i*Math.PI/5;for(const da of [-.035,.035])rod([x+Math.cos(a)*.075,.45+Math.sin(a)*.075,s*1.13],[x+Math.cos(a+da+.15)*.305,.45+Math.sin(a+da+.15)*.305,s*1.13],.014,silver);}
    cyl(.077,.04,[x,.45,s*1.14],silver);cyl(.035,.044,[x,.45,s*1.14],dark);
    for(let i=0;i<5;i++){const a=i*Math.PI*.4;cyl(.009,.045,[x+Math.cos(a)*.052,.45+Math.sin(a)*.052,s*1.14],gold);}
  }
  part('interior','Seats and analogue cockpit',[-.55,.92,-.18],.51,[0,0,-.1]);
  for(const s of [-1,1]){
    box([.52,.13,.38],[-.15,.47,s*.36],leather);box([.14,.48,.38],[.14,.7,s*.36],leather,[0,0,-.18]);box([.12,.15,.25],[.2,.98,s*.36],leather);
    for(let i=0;i<5;i++)box([.43,.006,.008],[-.17,.539,s*.36-.12+i*.06],gold);
  }
  box([.23,.22,1.13],[-.64,.76,0],carbon);box([1,.24,.18],[-.1,.58,0],silver);
  mesh(new T.TorusGeometry(.15,.018,8,32),dark,[-.54,.88,.35],[0,Math.PI/2,.2]);
  for(let i=0;i<3;i++)cyl(.044,.025,[-.715,.88,.24+i*.09],silver,[0,0,Math.PI/2]);

  // Merge equal-material geometry inside each independently animated part.
  for(const p of parts){
    p.group.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(p.group);bounds.getCenter(p.origin);p.radius=bounds.getSize(new T.Vector3()).length()/2;
    const batches=new Map<T.Material,T.BufferGeometry[]>();
    for(const child of [...p.group.children]){const m=child as T.Mesh; m.updateMatrix();const g=m.geometry.clone().applyMatrix4(m.matrix);g.translate(-p.origin.x,-p.origin.y,-p.origin.z);g.deleteAttribute('uv');const mat=m.material as T.Material;const list=batches.get(mat)??[];list.push(g);batches.set(mat,list);m.geometry.dispose();p.group.remove(m);}
    for(const [mat,geos] of batches){const merged=mergeGeometries(geos,false)!;geos.forEach(g=>g.dispose());const cloned=mat.clone() as T.MeshStandardMaterial;cloned.userData.baseEmissive=cloned.emissive.clone();cloned.userData.baseIntensity=cloned.emissiveIntensity;const m=new T.Mesh(merged,cloned);m.name=p.group.name;m.userData.component=p.id;p.group.add(m);p.materials.push(cloned);}
    p.group.position.copy(p.origin);
  }
  for(const mat of [paint,navy,carbon,silver,dark,rubber,leather,red,gold,glass,white,rearLight])mat.dispose();
  return {root,parts,dispose:()=>{for(const p of parts)for(const m of p.group.children as T.Mesh[]){m.geometry.dispose();(m.material as T.Material).dispose();}}};
}
