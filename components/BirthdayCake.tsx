"use client";
import { useEffect, useRef } from "react";

const wicks = [{ x: 222, y: 160 }, { x: 290, y: 126 }, { x: 355, y: 157 }];

// Semi-implicit damped springs: anchored roots, rising heat, wind and drag.
// The simulation runs independently of React renders and sleeps offscreen.
export function BirthdayCake({ lit, onBlow }: { lit: boolean; onBlow: () => void }) {
  const svg = useRef<SVGSVGElement>(null);
  const flames = useRef<(SVGGElement | null)[]>([]);
  const litRef = useRef(lit);
  const press = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const pointer = useRef({ x: -1000, y: -1000, previousX: 0, time: 0, wind: 0 });
  useEffect(() => { litRef.current = lit; }, [lit]);
  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    let frame = 0, previous = 0, time = 0, visible = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const states = wicks.map(() => ({ tip: 0, velocity: 0, middle: 0, middleVelocity: 0, height: 1, smokeAge: 10, wasLit: true }));
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame && !document.hidden) { previous = 0; frame = requestAnimationFrame(tick); }
    });
    observer.observe(element);
    function tick(now: number) {
      frame = 0;
      if (!visible || document.hidden) { previous = 0; return; }
      const dt = Math.min((now - (previous || now - 16.67)) / 1000, 0.033);
      previous = now;
      time += dt;
      pointer.current.wind *= Math.exp(-3.4 * dt);
      states.forEach((state, index) => {
        const group = flames.current[index];
        if (!group) return;
        const root = wicks[index];
        const isLit = litRef.current;
        if (state.wasLit && !isLit) state.smokeAge = 0;
        state.wasLit = isLit;
        state.smokeAge += dt;
        state.height += ((isLit ? 1 : 0) - state.height) * (1 - Math.exp(-9 * dt));
        const proximity = Math.exp(-Math.hypot(pointer.current.x - root.x, pointer.current.y - root.y) / 120);
        const wind = pointer.current.wind * proximity;
        const thermal = Math.sin(time * 4.6 + index * 2.1) * 2.4 + Math.sin(time * 11.3 + index) * 1.3;
        const target = reduced.matches ? 0 : Math.max(-26, Math.min(26, wind * 0.14 + thermal));
        state.velocity += ((target - state.tip) * 88 - state.velocity * 7.5) * dt;
        state.tip += state.velocity * dt;
        state.middleVelocity += ((state.tip * 0.4 - state.middle) * 125 - state.middleVelocity * 11) * dt;
        state.middle += state.middleVelocity * dt;
        const height = (35 + (reduced.matches ? 0 : Math.sin(time * 8 + index) * 2.4)) * state.height;
        const width = 9 * state.height;
        const tip = state.tip * state.height;
        const mid = state.middle * state.height;
        const shape = `M 0 1 C ${-width * 1.4} 0 ${-width + mid} ${-height * .53} ${tip} ${-height} C ${width * .1 + tip} ${-height * .60} ${width * 1.6 + mid} ${-height * .3} ${width * .8} -4 Q ${width * .4} 2 0 1 Z`;
        group.querySelectorAll<SVGPathElement>("[data-flame]").forEach(path => path.setAttribute("d", shape));
        group.querySelector<SVGGElement>("[data-fire]")?.setAttribute("opacity", String(state.height));
        const smoke = group.querySelector<SVGPathElement>("[data-smoke]");
        if (smoke) {
          const age = state.smokeAge;
          const opacity = !isLit && age < 3.2 && !reduced.matches ? Math.sin(Math.min(1, age / 0.35) * Math.PI / 2) * Math.max(0, 1 - age / 3.2) * .45 : 0;
          const lift = age * 29;
          const drift = Math.sin(time * 1.7 + index) * 13 + pointer.current.wind * .04;
          smoke.setAttribute("d", `M 0 ${-lift * .25} C ${-13 + drift} ${-14 - lift * .7} ${18 + drift} ${-28 - lift} ${drift} ${-48 - lift}`);
          smoke.setAttribute("opacity", String(opacity));
        }
      });
      frame = requestAnimationFrame(tick);
    }
    function resume() { if (!document.hidden && visible && !frame) { previous = 0; frame = requestAnimationFrame(tick); } }
    document.addEventListener("visibilitychange", resume);
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); document.removeEventListener("visibilitychange", resume); };
  }, []);

  return <button className={`cake-interaction ${lit ? "is-lit" : "is-out"}`}
    onPointerDown={event => { press.current = { x: event.clientX, y: event.clientY }; dragged.current = false; }}
    onPointerUp={() => { press.current = null; }}
    onPointerCancel={() => { press.current = null; dragged.current = false; }}
    onKeyDown={event => { if (event.key === "Enter" || event.key === " ") dragged.current = false; }}
    onClick={() => { if (dragged.current) { dragged.current = false; return; } onBlow(); }}
    aria-label={lit ? "吹灭蜡烛，许下生日心愿" : "重新点亮生日蜡烛"}>
    <svg ref={svg} viewBox="0 0 580 550" role="img" aria-labelledby="cake-title" onPointerMove={event => {
      if (press.current && Math.hypot(event.clientX - press.current.x, event.clientY - press.current.y) > 9) dragged.current = true;
      const point = event.currentTarget.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
      const matrix = event.currentTarget.getScreenCTM(); if (!matrix) return;
      const p = point.matrixTransform(matrix.inverse()); const now = performance.now();
      const last = pointer.current; const dt = Math.max(16, now - last.time);
      const velocity = last.time && now - last.time < 150 ? (p.x - last.previousX) / dt * 1000 : 0;
      pointer.current = { x: p.x, y: p.y, previousX: p.x, time: now, wind: Math.max(-300, Math.min(300, last.wind * .5 + velocity * .5)) };
    }} onPointerLeave={() => { pointer.current.x = -1000; }}>
      <title id="cake-title">手绘草莓奶油生日蛋糕，三支会随气流摇曳的蜡烛</title>
      <defs>
        <linearGradient id="cake-side" x1="0" y1="0" x2="1" y2=".25"><stop stopColor="#eed8b7"/><stop offset=".42" stopColor="#fff3da"/><stop offset="1" stopColor="#e6c59c"/></linearGradient>
        <linearGradient id="icing" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fffaf0"/><stop offset="1" stopColor="#f0dcbd"/></linearGradient>
        <linearGradient id="plate" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fdf8ef"/><stop offset=".5" stopColor="#e5d0af"/><stop offset="1" stopColor="#fff7e8"/></linearGradient>
        <linearGradient id="candle" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#ecd2ba"/><stop offset=".3" stopColor="#fff5dd"/><stop offset="1" stopColor="#dfc1a5"/></linearGradient>
        <radialGradient id="berry" cx=".32" cy=".2" r=".9"><stop stopColor="#ef7966"/><stop offset=".45" stopColor="#ce4c3b"/><stop offset="1" stopColor="#96372f"/></radialGradient>
        <linearGradient id="ribbon" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e47761"/><stop offset=".45" stopColor="#b94438"/><stop offset="1" stopColor="#9e322d"/></linearGradient>
        <linearGradient id="fire" x1="0" y1="1" x2="0" y2="0"><stop stopColor="#ff9e24"/><stop offset=".42" stopColor="#ffd265"/><stop offset="1" stopColor="#ecad41" stopOpacity=".6"/></linearGradient>
        <filter id="soft-shadow" x="-40%" y="-100%" width="180%" height="300%"><feGaussianBlur stdDeviation="9"/></filter>
        <filter id="flame-glow" x="-200%" y="-100%" width="500%" height="300%"><feGaussianBlur stdDeviation="7"/></filter>
        <g id="strawberry">
          <path d="M-19-8C-27 0-18 25 0 35C17 27 27 1 18-8C10-17-10-17-19-8Z" fill="url(#berry)" stroke="#ad4837" strokeWidth=".7"/>
          <path d="M-11-5Q-17 2-13 12" fill="none" stroke="#ffa08a" strokeWidth="3" strokeLinecap="round" opacity=".6"/>
          {[[-8,1],[5,0],[13,7],[-12,12],[0,11],[7,20],[-4,24]].map(([x,y],i)=><ellipse key={i} cx={x} cy={y} rx="1" ry="2" fill="#f9d492" transform={`rotate(15 ${x} ${y})`}/>)}
          <path d="m0-8-16-6 8-2-1-9L1-16l11-6-2 9 13 3-16 5-6-8-6 8-10 1Z" fill="#6d8055"/>
          <path d="M1-12Q-1-23 5-27" fill="none" stroke="#5b704b" strokeWidth="2" strokeLinecap="round"/>
        </g>
        <g id="rosette"><path d="M-14 4C-19-4-7-11-5-17C0-11 3-16 4-21C9-14 16-5 16 3C13 12-12 13-14 4Z" fill="url(#icing)" stroke="#dfc39b" strokeWidth=".7"/><path d="M-8 5Q-10-3-3-11M-1 8Q-5-2 3-12M7 7Q11 0 6-8" fill="none" stroke="#e6cba7" strokeWidth="1.5" strokeLinecap="round"/></g>
      </defs>
      <ellipse cx="294" cy="503" rx="181" ry="15" fill="#927348" opacity=".15" filter="url(#soft-shadow)"/>
      <path d="M258 414Q275 460 247 479Q222 485 226 496Q291 516 359 496Q362 485 334 479Q310 458 325 414Z" fill="url(#plate)" stroke="#d3bc97" strokeWidth="1.2"/>
      <path d="M272 440Q278 469 258 482M309 440Q304 471 326 484" fill="none" stroke="#fef9ee" strokeWidth="6" opacity=".7"/>
      <ellipse cx="290" cy="408" rx="218" ry="61" fill="#d7ba92"/>
      <ellipse cx="290" cy="400" rx="218" ry="60" fill="url(#plate)" stroke="#cbb18e" strokeWidth="1.2"/>
      <ellipse cx="290" cy="397" rx="206" ry="51" fill="none" stroke="#fffaf0" strokeWidth="3"/>
      <path d="M111 259L111 370C111 445 469 445 469 370V259Z" fill="url(#cake-side)" stroke="#d4b78e" strokeWidth="1.3"/>
      <path d="M116 325Q289 416 464 325" fill="none" stroke="#c14e40" strokeWidth="14"/>
      <path d="M117 322Q289 411 463 322" fill="none" stroke="#e2836d" strokeWidth="1.4"/>
      <path d="M118 290Q143 342 169 307Q195 364 227 321Q260 378 293 329Q325 376 356 321Q386 363 414 307Q444 338 464 290" fill="none" stroke="#d9ba91" strokeWidth="12" strokeLinecap="round"/>
      <path d="M118 287Q143 339 169 304Q195 361 227 318Q260 375 293 326Q325 373 356 318Q386 360 414 304Q444 335 464 287" fill="none" stroke="#fff1d4" strokeWidth="9" strokeLinecap="round"/>
      <path d="M111 253C104 230 132 205 181 194Q290 162 400 194Q479 216 469 254L468 280Q461 301 448 284Q440 272 431 293Q419 312 405 295Q395 279 383 304Q371 321 355 304Q344 291 329 314Q313 328 299 309Q288 296 275 315Q260 330 245 311Q235 297 220 309Q205 325 191 303Q178 284 164 301Q149 312 136 285Q128 274 121 285Q112 295 111 276Z" fill="url(#icing)" stroke="#e7cfaa" strokeWidth="1.2"/>
      <ellipse cx="290" cy="242" rx="179" ry="64" fill="#fff3dc" stroke="#e6cba6" strokeWidth="1"/>
      <ellipse cx="290" cy="241" rx="158" ry="48" fill="#f8e8ca" opacity=".6"/>
      {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17].map(i => {
        const a = i / 18 * Math.PI * 2;
        return <use key={i} href="#rosette" transform={`translate(${290+164*Math.cos(a)} ${242+54*Math.sin(a)}) scale(.9 .8)`}/>;
      })}
      {wicks.map((w,i)=><g key={i}>
        <rect x={w.x-7} y={w.y+5} width="14" height={i===1?111:107} rx="4" fill="url(#candle)" stroke="#d2b194" strokeWidth=".9"/>
        {[0,1,2,3,4].map(n=><path key={n} d={`M${w.x-6} ${w.y+21+n*20}l12-10v7l-12 10Z`} fill={i===1?"#b65b47":"#cb7d65"}/>)}
        <ellipse cx={w.x} cy={w.y+7} rx="7" ry="3" fill="#fff4db"/>
        <path d={`M${w.x} ${w.y+7}q-2-6 0-10`} stroke="#594537" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </g>)}
      <use href="#strawberry" transform="translate(166 228) rotate(-20) scale(1.05)"/>
      <use href="#strawberry" transform="translate(250 266) rotate(12) scale(1.1)"/>
      <use href="#strawberry" transform="translate(370 249) rotate(22) scale(1.05)"/>
      <use href="#strawberry" transform="translate(408 208) rotate(-18) scale(.8)"/>
      <use href="#strawberry" transform="translate(255 192) rotate(-15) scale(.7)"/>
      {Array.from({length:21},(_,i)=> {
        const a = (i / 20) * Math.PI;
        return <use key={i} href="#rosette" transform={`translate(${290+173*Math.cos(a)} ${369+48*Math.sin(a)}) scale(.68 .66)`}/>;
      })}
      <g transform="translate(294 374)" fill="url(#ribbon)" stroke="#97392e" strokeWidth="1">
        <path d="M0-4C-24-35-68-32-51-9Q-29 11-1 4C-16-16-32-25-44-16Q-31-18-4 0"/>
        <path d="M0-4C24-35 68-32 51-9Q29 11 1 4C16-16 32-25 44-16Q31-18 4 0"/>
        <path d="M-5 3Q-16 29-32 53L-18 48-11 58Q-1 32 3 8M5 3Q14 35 32 51L19 50 13 61Q0 36-3 8"/>
        <ellipse cy="1" rx="9" ry="8" fill="#c25443"/>
      </g>
      {wicks.map((w,i)=><g ref={node=>{ flames.current[i]=node; }} key={i} transform={`translate(${w.x} ${w.y})`}>
        <g data-fire="true">
          <path data-flame="true" d="M0 1Q-17-8 0-35Q18-8 0 1" fill="#ffba48" opacity=".6" filter="url(#flame-glow)"/>
          <path data-flame="true" d="M0 1Q-17-8 0-35Q18-8 0 1" fill="url(#fire)"/>
          <path data-flame="true" d="M0 1Q-17-8 0-35Q18-8 0 1" fill="#fff4bf" transform="scale(.53 .67)"/>
          <ellipse cx="0" cy="-2" rx="3.5" ry="4" fill="#fff9e3"/>
        </g>
        <path data-smoke="true" d="M0 0" fill="none" stroke="#8d8a80" strokeWidth="2.8" strokeLinecap="round" opacity="0"/>
      </g>)}
    </svg>
  </button>;
}
