import {lazy,Suspense,useCallback,useEffect,useRef,useState} from 'react';
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import ComponentExplorer from './components/ComponentExplorer';
import ComponentInfoPanel from './components/ComponentInfoPanel';
import ScrollProgress from './components/ScrollProgress';
import type {Selection} from './components/VehicleScene';
import {useScrollAnimation} from './hooks/useScrollAnimation';
import {scrollToProgress} from './utils/animationConfig';
import {SOURCES} from './data/components';
const VehicleScene=lazy(()=>import('./components/VehicleScene'));
export default function App(){
  const {scope,bar,percent,phase,reduced}=useScrollAnimation();
  const [selected,setSelected]=useState<Selection|null>(null),[resetKey,setResetKey]=useState(0),[failure,setFailure]=useState(false),[staticMode,setStaticMode]=useState(false);
  const modal=useRef<HTMLDialogElement>(null),sceneFailure=useCallback(()=>setFailure(true),[]);
  useEffect(()=>{if(phase!==4)setSelected(null);},[phase]);
  useEffect(()=>{const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')setSelected(null);};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);},[]);
  const isStatic=failure||(reduced&&!staticMode);
  return <main><div id="experience" className={`experience ${reduced?'reduced-motion':''}`} ref={scope}><div className={`experience-stage chapter-${phase} ${selected?'has-selection':''}`}>
    <Navigation onSources={()=>modal.current?.showModal()}/>
    <div className="stage-backdrop" aria-hidden="true"><div className="studio-halo"/><div className="floor-line"/></div>
    {!isStatic?<Suspense fallback={<div className="scene-loading">Preparing 3D scene…</div>}><VehicleScene selected={selected} onSelect={setSelected} phase={phase} resetKey={resetKey} onFailure={sceneFailure}/></Suspense>:<div className="static-scene"><img src="/poster.webp" alt="Procedural 3D study of the Tourbillon in a dark studio"/><div className="static-message">{failure?'3D rendering is unavailable on this device. You can still explore every system in the catalog.':'Reduced-motion view'}<button onClick={()=>{setFailure(false);setStaticMode(true);setResetKey(n=>n+1);}}> {failure?'Retry 3D':'Enable interactive 3D'}</button></div></div>}
    {!selected&&<HeroSection phase={phase}/>}
    <ScrollProgress phase={phase} bar={bar} percent={percent}/>
    {phase===0&&<><div className="hero-caption"><span className="caption-cross">+</span><p>Mechanical artistry.<br/>An entirely new perspective.</p></div><div className="hero-bottom"><button className="scroll-cue" onClick={()=>scrollToProgress(.32)}><span className="mouse-icon"/><span>Scroll to explore<small>A journey beneath the surface</small></span><span className="cue-arrow">↓</span></button><div className="hero-stat"><span>8.3 <small>L</small></span><p>Naturally aspirated V16</p></div><div className="hero-stat"><span>1,800 <small>hp</small></span><p>Combined power output</p></div><div className="hero-stat last-stat"><span>9,000 <small>rpm</small></span><p>Maximum engine speed</p></div></div></>}
    {(phase===1||phase===2)&&<div className="chapter-caption"><span>{phase===1?'Built for eternity.':'A choreography of precision.'}</span><p>{phase===1?'A new powertrain. An entirely new platform. The next chapter of Bugatti.':'Continue scrolling to separate the bodywork, drivetrain and central structure.'}</p></div>}
    {phase===4&&<><ComponentExplorer selected={selected?.id??null} onSelect={id=>setSelected({id})}/>{selected&&<ComponentInfoPanel id={selected.id} onBack={()=>setSelected(null)}/>}<div className="scene-toolbar"><span>{selected?'Drag to rotate the component':'Select in 3D or use the component index'}</span><button onClick={()=>{setSelected(null);setResetKey(n=>n+1);}}>↺ Reset view</button></div></>}
    <span className="study-disclosure">Independent procedural study</span>
  </div></div>
  <footer><div><span className="footer-wordmark">BUGATTI</span><h2>Beauty in every detail.</h2><p>An independent exploration of the Tourbillon’s engineering.<br/>Procedural geometry. Published specifications. Endless curiosity.</p></div><div className="footer-actions"><button onClick={()=>scrollToProgress(.95)}>Explore again ↗</button><a href="https://www.bugatti.com/en/models/tourbillon" target="_blank" rel="noreferrer">Discover the original at Bugatti ↗</a></div><div className="footer-bottom"><span>Unofficial fan-made engineering study. Not affiliated with Bugatti.</span><button onClick={()=>modal.current?.showModal()}>Sources & model notes</button><span>Pour l’éternité.</span></div></footer>
  <dialog ref={modal} className="sources-modal" onClick={e=>{if(e.target===modal.current)modal.current?.close();}}><button className="modal-close" onClick={()=>modal.current?.close()} aria-label="Close model notes">×</button><p className="panel-category">About this study</p><h2>The art.<br/>And the evidence.</h2><p>This is an independent interactive study, not an official Bugatti experience. The vehicle is a stylised procedural reconstruction with separately animated mechanical systems. Its shapes and internal layout are illustrative, not dimensionally accurate production geometry.</p><p>All geometry is created locally with Three.js. No extracted game assets or third-party vehicle models are included. Parts follow authored presentation trajectories, rather than workshop disassembly instructions.</p><p>Data comes from Bugatti’s launch materials and June 2024 specification sheet. Where a component mass, material specification or price is unavailable, the explorer says «Не опубликовано». No part prices are estimated.</p><div className="source-list"><a href={SOURCES.launch} target="_blank" rel="noreferrer">Bugatti · Tourbillon world premiere ↗</a><a href={SOURCES.specs} target="_blank" rel="noreferrer">Bugatti · Technical specifications, June 2024 ↗</a><a href={SOURCES.platform} target="_blank" rel="noreferrer">Bugatti · The new platform ↗</a></div></dialog>
  </main>;
}
