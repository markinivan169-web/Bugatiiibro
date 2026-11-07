import {useEffect,useRef} from 'react';
import {getComponent,SOURCES,type ComponentId} from '../data/components';
export default function ComponentInfoPanel({id,onBack}:{id:ComponentId;onBack:()=>void}){
  const c=getComponent(id),heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{heading.current?.focus({preventScroll:true});},[id]);
  return <aside className="info-panel" aria-label={`${c.category} details`} data-lenis-prevent>
    <button className="back-link" onClick={onBack}>← Back to exploded view</button><p className="panel-category">{c.category}</p><h2 tabIndex={-1} ref={heading}>{c.name}</h2><p className="description">{c.description}</p>
    <dl><div><dt>Material</dt><dd>{c.material}</dd></div><div><dt>Mass</dt><dd>{c.mass}</dd></div><div><dt>Component cost · EUR</dt><dd>Не опубликовано</dd></div></dl>
    <p className="technical-label">Engineering notes</p><ul>{c.facts.map(f=><li key={f}>{f}</li>)}</ul><a className="source-link" href={SOURCES[c.source]} target="_blank" rel="noreferrer">Read the Bugatti source ↗</a><p className="panel-footnote">Technical specifications describe the real car. Geometry is an independent procedural study, not factory CAD.</p>
  </aside>;
}
