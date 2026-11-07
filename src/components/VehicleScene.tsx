import {Component, Suspense, useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {Environment,Lightformer,OrbitControls,AdaptiveDpr} from '@react-three/drei';
import * as T from 'three';
import {buildVehicle} from '../utils/vehicle';
import {motion,smooth} from '../utils/animationConfig';
import {getComponent,type ComponentId} from '../data/components';
export interface Selection {id:ComponentId;name?:string}
interface Props {selected:Selection|null;onSelect:(v:Selection|null)=>void;phase:number;resetKey:number;onFailure:()=>void;}
const labelIds:ComponentId[]=['powertrain','transmission','chassis','suspension','brakes','aero'];
class SceneBoundary extends Component<{children:ReactNode;onFailure:()=>void},{failed:boolean}>{
  state={failed:false};static getDerivedStateFromError(){return {failed:true};}componentDidCatch(){this.props.onFailure();}render(){return this.state.failed?null:this.props.children;}
}
function Vehicle({selected,onSelect,phase,resetKey,onFailure}:Props){
  const vehicle=useMemo(buildVehicle,[]),{camera,size,gl,invalidate,setFrameloop,setDpr}=useThree();
  const controls=useRef<ComponentRef<typeof OrbitControls>>(null);
  const hover=useRef<string|null>(null),lastSelection=useRef(''),settled=useRef(false),frames=useRef(0);
  const target=useMemo(()=>new T.Vector3(),[]),camTarget=useMemo(()=>new T.Vector3(),[]),desired=useMemo(()=>new T.Vector3(),[]);
  const highlight=useMemo(()=>new T.Color('#467f99'),[]),labelVector=useMemo(()=>new T.Vector3(),[]);
  const labelElements=useRef<HTMLElement[]>([]);
  const chosen=selected?vehicle.parts.find(p=>p.id===selected.id&&(!selected.name||p.group.name===selected.name)):null;
  useEffect(()=>()=>vehicle.dispose(),[vehicle]);
  useEffect(()=>{settled.current=false;frames.current=0;invalidate();},[selected,resetKey,invalidate]);
  useEffect(()=>{setDpr(size.width<760?1:Math.min(devicePixelRatio,1.5));invalidate();},[size.width,setDpr,invalidate]);
  useEffect(()=>{
    const draw=()=>{if(!document.hidden){settled.current=false;setFrameloop('demand');invalidate();}};
    const visibility=()=>{setFrameloop(document.hidden?'never':'demand');invalidate();};
    const lost=(e:Event)=>{e.preventDefault();onFailure();};
    window.addEventListener('tourbillon:frame',draw);document.addEventListener('visibilitychange',visibility);gl.domElement.addEventListener('webglcontextlost',lost);
    gl.domElement.style.touchAction='pan-y';
    labelElements.current=Array.from(gl.domElement.closest('.vehicle-scene')?.querySelectorAll<HTMLElement>('.scene-label')??[]);
    return()=>{window.removeEventListener('tourbillon:frame',draw);document.removeEventListener('visibilitychange',visibility);gl.domElement.removeEventListener('webglcontextlost',lost);document.body.style.cursor='';};
  },[gl,invalidate,onFailure,setFrameloop]);
  useFrame((_,delta)=>{
    const p=motion.progress,e=smooth(.30,.66,p),mobile=size.width<760;
    const key=selected?`${selected.id}/${selected.name??''}`:`none/${resetKey}`;
    if(key!==lastSelection.current){settled.current=false;lastSelection.current=key;}
    const angle=selected?0:.06+smooth(.12,.32,p)*.62-smooth(.55,.8,p)*.2;
    vehicle.root.rotation.y=T.MathUtils.damp(vehicle.root.rotation.y,angle,6,Math.min(delta,.06));
    let moving=false;
    for(const part of vehicle.parts){
      const t=smooth(part.start,part.start+.18,p);
      desired.copy(part.origin).addScaledVector(part.offset,t);
      if(chosen===part)desired.set(0,.75,0);
      const distance=part.group.position.distanceToSquared(desired);if(distance>.000001)moving=true;
      part.group.position.lerp(desired,1-Math.exp(-delta*7));
      part.group.rotation.set(part.rotation.x*t,part.rotation.y*t,part.rotation.z*t);
      const active=hover.current===part.group.name||chosen===part;
      for(const mat of part.materials){
        const dim=!!chosen&&chosen!==part;
        if(mat.transparent!==dim){mat.transparent=dim;mat.depthWrite=!dim;mat.needsUpdate=true;}mat.opacity=dim?.09:1;
        mat.emissive.copy(active?highlight:mat.userData.baseEmissive);mat.emissiveIntensity=active?.35:mat.userData.baseIntensity;
      }
    }
    const distance=chosen?Math.max(2.1,chosen.radius*(mobile?4.7:3.3)):0;
    target.set(0,selected?.75:.58+e*.28,0);
    if(chosen)camTarget.set(-distance*.65,distance*.42+.75,distance*.83);
    else {const zoom=mobile?1.03:1,intro=smooth(0,.15,p);camTarget.set((-5.3-intro*.5-e*1.6)*zoom,(2.05+intro*.3+e*2.8)*zoom,(6.1+intro*.7+e*2)*zoom);}
    const interactive=phase===4&&!moving;
    const allowOrbit=interactive&&settled.current;
    if(controls.current){controls.current.enabled=allowOrbit;controls.current.enableRotate=allowOrbit;controls.current.enableZoom=false;controls.current.target.lerp(target,1-Math.exp(-delta*6));}
    if(!allowOrbit){camera.position.lerp(camTarget,1-Math.exp(-delta*5));camera.lookAt(target);if(camera.position.distanceToSquared(camTarget)<.0001)settled.current=true;}
    if(phase>=3&&!selected){let lastY=-100;labelIds.forEach((id,i)=>{const node=labelElements.current[i],part=vehicle.parts.find(v=>v.id===id);if(!node||!part)return;part.group.getWorldPosition(labelVector);labelVector.y+=.18;labelVector.project(camera);const x=(labelVector.x*.5+.5)*size.width,y=(-labelVector.y*.5+.5)*size.height;const overlaps=Math.abs(y-lastY)<35;node.style.transform=`translate(${x}px, ${y}px)`;node.style.opacity=overlaps?'0':'1';if(!overlaps)lastY=y;});}
    if(moving||!settled.current||frames.current++<8)invalidate();
    // Lower resolution when sustained frame times indicate a slower device.
    if(frames.current===90&&delta>.035)setDpr(1);
  });
  return <>
    <primitive object={vehicle.root}
      onClick={(ev:{stopPropagation:()=>void;object:T.Object3D;delta:number})=>{if(phase!==4||ev.delta>5)return;ev.stopPropagation();const id=ev.object.userData.component as ComponentId;if(id)onSelect({id,name:ev.object.name});}}
      onPointerOver={(ev:{stopPropagation:()=>void;object:T.Object3D})=>{if(phase<3)return;ev.stopPropagation();hover.current=ev.object.name;document.body.style.cursor='pointer';invalidate();}}
      onPointerOut={()=>{hover.current=null;document.body.style.cursor='';invalidate();}} />
    <OrbitControls ref={controls} makeDefault enabled={false} enablePan={false} enableZoom={false} minDistance={1.2} maxDistance={25} maxPolarAngle={Math.PI*.85} dampingFactor={.08}/>
    <ambientLight intensity={.65}/><directionalLight position={[-3,6,4]} intensity={3} color="#e5efff"/><directionalLight position={[3,2,-3]} intensity={2} color="#91adc5"/>
    <Environment resolution={128} frames={1}><Lightformer position={[0,5,0]} rotation-x={Math.PI/2} scale={[10,4,1]} intensity={3}/><Lightformer position={[-4,2,3]} rotation-y={Math.PI/2} scale={[7,2,1]} intensity={3}/><Lightformer position={[3,2,-4]} scale={[10,1,1]} intensity={4}/></Environment>
    <AdaptiveDpr pixelated/>
  </>;
}
function Labels({phase,selected}:Pick<Props,'phase'|'selected'>){return <div className={`scene-labels ${phase>=3&&!selected?'visible':''}`} aria-hidden="true">{labelIds.map((id,i)=><div key={id} className={`scene-label label-${i}`}><span>{String(i+1).padStart(2,'0')}</span>{getComponent(id).category}<i/></div>)}</div>;}
export default function VehicleScene(props:Props){
  const [ready,setReady]=useState(false);
  return <div className="vehicle-scene" aria-label="Interactive procedural 3D engineering model of the Bugatti Tourbillon">
    {!ready&&<div className="scene-loading"><span className="loading-ring"/>Preparing the engineering study</div>}
    <SceneBoundary onFailure={props.onFailure}><Suspense fallback={null}><Canvas dpr={[1,1.5]} frameloop="demand" camera={{position:[-5.8,2.35,6.8],fov:35,near:.1,far:250}} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} onCreated={({gl})=>{gl.toneMapping=T.ACESFilmicToneMapping;gl.toneMappingExposure=1.05;setReady(true);}}><Vehicle {...props}/></Canvas></Suspense></SceneBoundary>
    <Labels phase={props.phase} selected={props.selected}/>
  </div>;
}
