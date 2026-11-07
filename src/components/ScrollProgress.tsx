import type {RefObject} from 'react';
import {phases,scrollToProgress} from '../utils/animationConfig';
const starts=[0,.20,.45,.72,.95];
export default function ScrollProgress({phase,bar,percent}:{phase:number;bar:RefObject<HTMLDivElement|null>;percent:RefObject<HTMLSpanElement|null>}){return <><div className="chapter-rail" aria-label="Experience chapters">{phases.map((title,i)=><button key={title} className={phase===i?'active':''} aria-label={title} aria-current={phase===i?'step':undefined} onClick={()=>scrollToProgress(starts[i])}><span>{String(i+1).padStart(2,'0')}</span><i/></button>)}</div><div className="scroll-track"><div ref={bar}/></div><div className="progress-readout"><span ref={percent}>000</span><span>/ 100</span></div></>;}
