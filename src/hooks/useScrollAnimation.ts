import {useEffect, useRef, useState} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {motion,phaseAt} from '../utils/animationConfig';
gsap.registerPlugin(ScrollTrigger);
export function useScrollAnimation(){
  const scope=useRef<HTMLDivElement>(null),bar=useRef<HTMLDivElement>(null),percent=useRef<HTMLSpanElement>(null);
  const [phase,setPhase]=useState(0),[reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{const mq=matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduced(mq.matches);mq.addEventListener('change',change);return()=>mq.removeEventListener('change',change);},[]);
  useEffect(()=>{
    motion.reduced=reduced;
    const lenis=reduced?null:new Lenis({duration:1.15,smoothWheel:true,syncTouch:false});
    const tick=(time:number)=>lenis?.raf(time*1000);if(lenis){lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(tick);}
    const navigate=(e:Event)=>{const top=(e as CustomEvent<number>).detail;if(lenis)lenis.scrollTo(top,{duration:1.6});else window.scrollTo({top,behavior:'instant'});};
    window.addEventListener('tourbillon:scroll',navigate);
    let previous=-1;
    const ctx=gsap.context(()=>{
      if(!reduced)gsap.from('.intro-reveal',{y:22,opacity:0,duration:1.3,stagger:.12,ease:'power3.out',clearProps:'all'});
      const update=()=>{const p=motion.progress;const next=phaseAt(p);if(previous!==next){previous=next;setPhase(next);}if(bar.current)bar.current.style.transform=`scaleX(${p})`;if(percent.current)percent.current.textContent=String(Math.round(p*100)).padStart(3,'0');window.dispatchEvent(new Event('tourbillon:frame'));};
      const trigger={trigger:scope.current,start:'top top',end:'bottom bottom',invalidateOnRefresh:true};
      if(reduced)ScrollTrigger.create({...trigger,onUpdate:self=>{motion.progress=self.progress;update();},onRefresh:self=>{motion.progress=self.progress;update();}});
      else gsap.to(motion,{progress:1,ease:'none',onUpdate:update,scrollTrigger:{...trigger,scrub:.7}});
      const refresh=()=>ScrollTrigger.refresh();document.fonts.ready.then(refresh);update();
    },scope);
    return()=>{ctx.revert();lenis?.destroy();gsap.ticker.remove(tick);window.removeEventListener('tourbillon:scroll',navigate);};
  },[reduced]);
  return {scope,bar,percent,phase,reduced};
}
