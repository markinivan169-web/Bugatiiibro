export const motion = { progress: 0, reduced: false };
export const phases = ['The silhouette', 'Shaped by speed', 'Beneath the surface', 'Engineering, exposed', 'Explore the components'];
export function phaseAt(p:number) {return p<.15?0:p<.30?1:p<.65?2:p<.85?3:4;}
export function smooth(a:number,b:number,x:number){const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);}
export function scrollToProgress(p:number){const el=document.getElementById('experience');if(!el)return;const range=el.offsetHeight-innerHeight;window.dispatchEvent(new CustomEvent('tourbillon:scroll',{detail:el.offsetTop+range*p}));}
