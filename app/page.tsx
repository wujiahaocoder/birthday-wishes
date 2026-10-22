"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUpRight, ArrowRight, Check, Copy, Heart, Music2, Volume2, Pencil, X, Sparkles, Send, Gift, Sun, Star, RefreshCw, LoaderCircle, Share2, Wind, Mail, ChevronDown } from "lucide-react";
import { BirthdayCake } from "@/components/BirthdayCake";
import { defaultCelebration, builtInMessages, presets, configSchema, type Celebration, type CelebrationConfig, type Message } from "@/lib/celebration";

type Filter = "all" | "message" | "wish";
type Toast = { text: string; error?: boolean };

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...options, signal: AbortSignal.timeout(15000), headers: { "Content-Type": "application/json", ...options?.headers } });
  let data: unknown;
  try { data = await response.json(); } catch { throw new Error("暂时连接不上，请稍后重试。填写的内容会保留。"); }
  if (!response.ok) throw new Error((data as { error?: string })?.error || "暂时没能完成，请稍后再试");
  return data as T;
}
function messageError(error: unknown) {
  return error instanceof Error && error.name !== "TimeoutError" && error.name !== "TypeError" ? error.message : "连接有点慢，请检查网络后重试。填写的内容会保留。";
}
function getToken(id: string) { try { return localStorage.getItem(`birthday-edit:${id}`) || ""; } catch { return ""; } }
function configOf(board: Celebration): CelebrationConfig { const { id: _id, ...config } = board; return config; }

function Asterisk({ className = "" }: { className?: string }) {
  return <svg className={className} width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true"><path d="M18 3v30M3 18h30M7.4 7.4l21.2 21.2M7.4 28.6 28.6 7.4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>;
}
function Bow({ className = "" }: { className?: string }) {
  return <svg className={className} width="92" height="76" viewBox="0 0 92 76" fill="none" aria-hidden="true"><path d="M46 32C14-9-8 15 17 30c10 5 19 7 29 2Zm0 0C70-9 106 12 78 29c-11 7-20 8-32 3Zm-3 4C35 44 32 61 17 69m32-33c6 9 8 22 24 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><ellipse cx="46" cy="33" rx="6" ry="5" fill="currentColor"/></svg>;
}
function Doodle({ kind }: { kind: "sun" | "heart" | "flower" }) {
  return <svg viewBox="0 0 120 110" aria-hidden="true" className="wish-doodle" fill="none">
    {kind === "sun" ? <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="60" cy="52" r="24"/><path d="M60 10v10m0 64v10M18 52h10m64 0h10M30 22l7 8m47 47 7 7M30 82l7-7m47-47 7-7"/><path d="M49 55q11 12 22 0"/><path d="M48 44v3m24-3v3"/></g> : kind === "heart" ? <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M60 88C-3 51 25 8 59 40c30-36 68 9 1 48Z"/><path d="M25 24 20 17m36 4-1-9m34 13 7-7M35 55q-6-9 1-14"/><path d="m91 78 8 2-4 6"/></g> : <g stroke="currentColor" strokeWidth="2.5"><path d="M60 40C20 1 18 55 43 54 2 68 41 104 50 76c-3 41 41 35 25 7 38 18 47-25 17-24 33-24-3-52-17-23 9-40-35-35-15 4Z"/><circle cx="64" cy="57" r="13"/><path d="M58 59q7 7 13 0" strokeLinecap="round"/><path d="M58 52v3m13-3v3"/></g>}
  </svg>;
}

function Modal({ title, children, onClose, className = "" }: { title: string; children: ReactNode; onClose: () => void; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = old; };
  }, []);
  return <dialog className={`modal ${className}`} ref={ref} aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal-inner"><button type="button" className="icon-button modal-close" onClick={onClose} aria-label="关闭弹窗"><X size={21}/></button>{children}</div>
  </dialog>;
}

function Customize({ board, owned, onSave, onClose }: { board: Celebration; owned: boolean; onSave: (config: CelebrationConfig) => Promise<void>; onClose: () => void }) {
  const [draft, setDraft] = useState<CelebrationConfig>(configOf(board));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  function update<K extends keyof CelebrationConfig>(key: K, value: CelebrationConfig[K]) { setDraft(previous => ({ ...previous, [key]: value })); }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (saving) return;
    const checked = configSchema.safeParse(draft);
    if (!checked.success) { setError(checked.error.issues[0].message); return; }
    setSaving(true); setError("");
    try { await onSave(checked.data); } catch (e) { setError(messageError(e)); setSaving(false); }
  }
  return <Modal title="定制专属生日祝福" className="customize-modal" onClose={() => { if (!saving) onClose(); }}>
    <div className="modal-heading"><span className="eyebrow"><Sparkles size={14}/> MAKE IT PERSONAL</span><h2>让这份偏爱，<br/>有一个专属的名字。</h2><p>填上 TA 的名字，把想说的话装进这封信。</p></div>
    <form onSubmit={submit} className="customize-form">
      <div className="form-row"><label>寿星的名字 <span>*</span><input autoFocus required maxLength={20} value={draft.name} onChange={e => update("name", e.target.value)} placeholder="今天的主角叫什么？"/></label><label>迎接几岁 <small>选填</small><input type="number" min={1} max={120} value={draft.age ?? ""} onChange={e => update("age", e.target.value === "" ? null : Number(e.target.value))} placeholder="永远年轻"/></label></div>
      <div className="form-row"><label>生日日期 <span>*</span><input required type="date" min="1900-01-01" max="2200-12-31" value={draft.birthday} onChange={e => update("birthday", e.target.value)}/></label><label>你的署名 <span>*</span><input required maxLength={30} value={draft.sender} onChange={e => update("sender", e.target.value)} placeholder="爱你的朋友"/></label></div>
      <fieldset><legend>挑一份祝福灵感</legend><div className="preset-buttons">{Object.values(presets).map(preset => <button type="button" key={preset.label} className={draft.blessing === preset.text ? "selected" : ""} onClick={() => update("blessing", preset.text)}>{preset.label}</button>)}</div></fieldset>
      <label>想对 TA 说的话 <span>*</span><textarea required rows={7} maxLength={1200} value={draft.blessing} onChange={e => update("blessing", e.target.value)}/><span className="field-count">{draft.blessing.length} / 1200</span></label>
      <fieldset><legend>选择这份祝福的颜色</legend><div className="theme-options">{([{ id: "cherry", name: "樱桃奶油", color: "#b95043" }, { id: "matcha", name: "抹茶来信", color: "#5b7258" }, { id: "berry", name: "暮色莓果", color: "#8a5a7b" }] as const).map(theme => <button key={theme.id} type="button" aria-pressed={draft.theme === theme.id} className={draft.theme === theme.id ? "selected" : ""} onClick={() => update("theme", theme.id)}><i style={{ background: theme.color }}>{draft.theme === theme.id && <Check size={14}/>}</i>{theme.name}</button>)}</div></fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button primary full-width" disabled={saving} type="submit">{saving ? <LoaderCircle className="spin" size={17}/> : <Heart size={17}/>} {saving ? "正在珍藏这份心意…" : owned ? "保存这份专属祝福" : "保存并生成专属祝福页"}</button>
      <p className="form-footnote">创建后，请在当前浏览器继续编辑。分享链接只包含祝福。</p>
    </form>
  </Modal>;
}

export default function Home() {
  const [board, setBoard] = useState<Celebration>(defaultCelebration);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [editToken, setEditToken] = useState("");
  const [customize, setCustomize] = useState(false);
  const [share, setShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [lit, setLit] = useState(true);
  const [confetti, setConfetti] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [surprise, setSurprise] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [messages, setMessages] = useState<Message[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [wallError, setWallError] = useState("");
  const [wallBusy, setWallBusy] = useState(false);
  const [kind, setKind] = useState<"message" | "wish">("message");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState<Message["color"]>("peach");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");
  const [sent, setSent] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const audioTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageRequest = useRef(0);
  const pendingId = useRef<string | null>(null);
  const pendingBody = useRef("");
  const submitLock = useRef(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const loadBoard = useCallback(async () => {
    setReady(false); setLoadError("");
    const id = new URLSearchParams(window.location.search).get("id") || "demo";
    try {
      const result = await api<{ celebration: Celebration }>(`/api/celebrations/${encodeURIComponent(id)}`);
      setBoard(result.celebration); setEditToken(getToken(id)); setReady(true);
    } catch (e) { setLoadError(messageError(e)); }
  }, []);
  useEffect(() => { void loadBoard(); window.addEventListener("popstate", loadBoard); return () => window.removeEventListener("popstate", loadBoard); }, [loadBoard]);
  useEffect(() => { document.title = `${board.name}，生日快乐 · 今日偏爱`; }, [board.name]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 4500); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { if (!confetti) return; const timer = setTimeout(() => setConfetti(0), 3500); return () => clearTimeout(timer); }, [confetti]);
  useEffect(() => () => { if (audioTimer.current) clearTimeout(audioTimer.current); void audio.current?.close(); }, []);

  const loadMessages = useCallback(async (offset = 0) => {
    const requestId = ++messageRequest.current;
    setWallBusy(true); setWallError("");
    try {
      const result = await api<{ messages: Message[]; allTotal: number; hasMore: boolean }>(`/api/celebrations/${board.id}/messages?offset=${offset}&kind=${filter}`);
      if (requestId !== messageRequest.current) return;
      setMessages(old => offset ? [...old, ...result.messages.filter(item => !old.some(existing => existing.id === item.id))] : result.messages);
      setTotal(result.allTotal); setHasMore(result.hasMore);
    } catch (e) { if (requestId === messageRequest.current) setWallError(messageError(e)); }
    finally { if (requestId === messageRequest.current) setWallBusy(false); }
  }, [board.id, filter]);
  useEffect(() => { if (ready) { setMessages([]); void loadMessages(); } }, [ready, loadMessages]);

  async function saveConfig(config: CelebrationConfig) {
    const result = await api<{ celebration: Celebration; editToken?: string }>(editToken ? `/api/celebrations/${board.id}` : "/api/celebrations", {
      method: editToken ? "PATCH" : "POST", headers: editToken ? { "X-Edit-Token": editToken } : {}, body: JSON.stringify(config),
    });
    if (result.editToken) {
      setEditToken(result.editToken);
      try { localStorage.setItem(`birthday-edit:${result.celebration.id}`, result.editToken); }
      catch { setToast({ text: "祝福已保存；浏览器未允许保存编辑权限，请保持此页面打开。" }); }
    }
    setBoard(result.celebration); setReady(true); setCustomize(false); setLit(true);
    window.history.replaceState({}, "", `/?id=${result.celebration.id}`);
    setConfetti(Date.now()); setToast({ text: "专属祝福已保存，快把这份偏爱分享给 TA 吧。" });
  }
  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (submitLock.current || !ready) return;
    if (!name.trim() || !content.trim()) { setFormError("留下你的称呼，再写下一点心意吧。"); return; }
    const trap = new FormData(event.currentTarget).get("website");
    const payload = JSON.stringify({ name: name.trim(), content: content.trim(), kind, color });
    if (!pendingId.current || pendingBody.current !== payload) { pendingId.current = crypto.randomUUID(); pendingBody.current = payload; }
    submitLock.current = true; setSending(true); setFormError(""); setSent(false);
    try {
      await api(`/api/celebrations/${board.id}/messages`, { method: "POST", body: JSON.stringify({ ...JSON.parse(payload), id: pendingId.current, website: trap || "" }) });
      setContent(""); pendingId.current = null; setSent(true); setToast({ text: kind === "wish" ? "愿望已被好好珍藏，愿它慢慢实现。" : "你的祝福已被好好珍藏。" });
      if (filter !== "all") setFilter("all"); else await loadMessages();
    } catch (e) { setFormError(messageError(e)); }
    finally { submitLock.current = false; setSending(false); }
  }
  function blowCandles() {
    if (lit) { setLit(false); setConfetti(Date.now()); setToast({ text: "呼——愿望已经出发，好运正在赶来。" }); }
    else setLit(true);
  }
  async function toggleMusic() {
    if (playing) { if (audioTimer.current) clearTimeout(audioTimer.current); await audio.current?.close(); audio.current = null; setPlaying(false); return; }
    try {
      const context = new AudioContext(); audio.current = context; await context.resume(); setPlaying(true);
      const notes: [number, number][] = [[67,.35],[67,.18],[69,.65],[67,.65],[72,.65],[71,1.2],[67,.35],[67,.18],[69,.65],[67,.65],[74,.65],[72,1.2],[67,.35],[67,.18],[79,.65],[76,.65],[72,.65],[71,.65],[69,1.1],[77,.35],[77,.18],[76,.65],[72,.65],[74,.65],[72,1.5]];
      let start = context.currentTime + .1;
      notes.forEach(([note, duration]) => {
        const oscillator = context.createOscillator(); const gain = context.createGain();
        oscillator.type = "sine"; oscillator.frequency.value = 440 * Math.pow(2, (note - 69) / 12);
        gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.16, start + .015); gain.gain.exponentialRampToValueAtTime(.001, start + duration + .3);
        oscillator.connect(gain); gain.connect(context.destination); oscillator.start(start); oscillator.stop(start + duration + .35); start += duration;
      });
      audioTimer.current = setTimeout(() => { void context.close(); if (audio.current === context) { setPlaying(false); audio.current = null; } }, (start - context.currentTime + .5) * 1000);
    } catch { setPlaying(false); setToast({ text: "当前浏览器无法播放旋律，请换一个浏览器试试。", error: true }); }
  }
  async function copyShare() {
    try { await navigator.clipboard.writeText(window.location.origin + (board.id === "demo" ? "/" : `/?id=${board.id}`)); setCopied(true); }
    catch { setToast({ text: "可以长按或选中下方链接来复制。" }); }
  }
  function wishNow() { setKind("wish"); document.getElementById("wishes")?.scrollIntoView({ behavior: "smooth" }); setTimeout(() => contentRef.current?.focus({ preventScroll: true }), 500); }
  const dateParts = board.birthday.split("-");
  const visibleBuiltIns = builtInMessages.filter(message => filter === "all" || message.kind === filter);
  const displayedMessages = messages.length ? [...messages, ...visibleBuiltIns.slice(0, Math.max(0, 4 - messages.length))] : total === 0 ? visibleBuiltIns : [];
  const fortunes = ["你认真期待的事，正在慢慢向你靠近。", "好事不一定在转角，但一定在前方。", "你本来就很值得，不必用完美来交换喜欢。", "这一岁，快乐会比烦恼先找到你。", "去见想见的人吧，今天的风也在为你加油。"];

  return <div className={`birthday-site theme-${board.theme}`}>
    <a className="skip-link" href="#main">跳到主要内容</a>
    <header className="site-header"><div className="header-inner">
      <a className="brand" href="#home" aria-label="今日偏爱，返回顶部"><Asterisk/><span>今日偏爱<small>A LITTLE CELEBRATION</small></span></a>
      <nav aria-label="页面导航"><a href="#home" className="nav-home">生日快乐 <span>·</span></a><a href="#letter">一封小信</a><a href="#wishes">许愿留言</a></nav>
      <div className="header-actions"><button className={`icon-button music-button ${playing ? "playing" : ""}`} onClick={toggleMusic} aria-label={playing ? "暂停生日旋律" : "播放生日旋律"} title={playing ? "暂停生日旋律" : "播放生日旋律"} aria-pressed={playing}>{playing ? <Volume2 size={18}/> : <Music2 size={18}/>}</button><button className="button customize-button" onClick={() => setCustomize(true)} disabled={!ready}><Pencil size={14}/><span>{editToken ? "编辑专属祝福" : "定制这份祝福"}</span></button><button className="icon-button share-top" onClick={() => { setShare(true); setCopied(false); }} aria-label="分享生日祝福"><Share2 size={17}/></button></div>
    </div></header>
    <main id="main">
      {loadError ? <section className="load-error"><Mail size={48}/><h1>这封信暂时没有送达</h1><p>{loadError}</p><button className="button primary" onClick={loadBoard}><RefreshCw size={16}/>重新打开</button><a href="/">看看内置的生日祝福</a></section> : <>
      <section id="home" className="hero section-wrap">
        <div className="hero-copy"><div className="eyebrow hero-eyebrow"><span className="tiny-star">✧</span> A DAY ALL ABOUT YOU <span className="small-line"/></div>
          <h1><span>Happy</span><span className="birthday-word">Birthday<span className="period">.</span><svg viewBox="0 0 520 24" aria-hidden="true"><path d="M4 16Q250-6 512 12M60 23Q295 4 475 19" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg></span></h1>
          <h2>亲爱的 <span className="recipient">{board.name}</span>，生日快乐<span className="hand-heart">♡</span></h2>
          <p className="hero-description">世界那么大，很高兴有你。<br/>今天的快乐、鲜花和偏爱，统统都属于你。</p>
          <div className="hero-buttons"><a href="#letter" className="button primary">收下这份祝福 <ArrowUpRight size={18}/></a><button className="button quiet" onClick={wishNow}><Sparkles size={17}/>许个小愿望</button></div>
          <div className="hero-footnote"><span className="little-heart">♥</span> {board.age ? `${board.age} 岁的你，也要继续闪闪发光。` : "新的一岁，继续做闪闪发光的自己。"}</div>
        </div>
        <div className="hero-art"><div className="cake-halo"/><div className="date-stamp"><span>YOUR SPECIAL DAY</span><strong>{dateParts[1]}<i> / </i>{dateParts[2]}</strong><small>{dateParts[0]} · WITH LOVE</small></div>
          <span className="handwritten cake-caption">a little sweetness,<br/><i>just for you.</i></span><Asterisk className="art-star star-one"/><Asterisk className="art-star star-two"/><span className="art-sparkle">✧</span>
          <BirthdayCake lit={lit} onBlow={blowCandles}/>
          <div className="cake-note"><span>今日份幸福</span><strong>请全部签收 <Heart size={15}/></strong></div>
          <button className="candle-hint" onClick={blowCandles}>{lit ? <Wind size={15}/> : <Sparkles size={15}/>}<span>{lit ? "轻拂火焰，点击蛋糕许个愿" : "愿望已送达 · 再点亮一次"}</span><ArrowRight size={14}/></button>
        </div>
        <div className="hero-bottom"><span><i>01</i> 今天，认真快乐</span><span><i>02</i> 生活，慢慢热爱</span><span><i>03</i> 未来，尽情期待</span><a href="#letter" aria-label="向下阅读生日来信"><ArrowDown size={18}/></a></div>
      </section>
      <div className="celebration-ribbon" aria-hidden="true"><div><span>MAKE A WISH</span><Asterisk/><span>万事可期</span><Asterisk/><span>STAY GOLDEN</span><Asterisk/><span>岁岁欢喜</span><Asterisk/><span>BE LOVED</span><Asterisk/><span>生日快乐</span><Asterisk/></div></div>
      <section id="letter" className="letter-section section-wrap">
        <div className="section-intro"><span className="eyebrow"><span className="section-number">01 /</span> A LETTER FOR YOU</span><h2>有些话，<br/>想在今天说。</h2><p>把平时没说出口的在意，<br/>写成一封只属于你的信。</p><Bow className="letter-bow"/><span className="handwritten letter-side-note">You make the world<br/>a little brighter.</span></div>
        <article className="letter-paper"><div className="paper-tape"/><div className="letter-top"><span>To. <strong>{board.name}</strong></span><div className="postage"><Heart size={24} strokeWidth={1.4}/><small>WITH LOVE</small></div></div><div className="letter-body">{board.blessing.split(/\n\s*\n/).map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div><div className="letter-signature"><span>永远为你加油的</span><strong>{board.sender}</strong><small>{dateParts.join(" . ")}</small></div><div className="letter-bottom-line"><Heart size={11}/> EVERY WORD, FROM THE HEART</div></article>
      </section>
      <section className="little-wishes section-wrap"><div className="section-heading"><div><span className="eyebrow"><span className="section-number">02 /</span> GOOD THINGS AHEAD</span><h2>这一岁，愿你……</h2></div><span className="handwritten">all the good things.</span></div>
        <div className="wish-triptych"><article className="wish-panel"><span className="panel-no">01 — JOY</span><Doodle kind="sun"/><h3>心里有光，日子有趣。</h3><p>小事也值得开心，<br/>每一天都有自己的小确幸。</p></article><article className="wish-panel"><span className="panel-no">02 — COURAGE</span><Doodle kind="flower"/><h3>自在生长，慢慢盛放。</h3><p>不必赶路，也不必比较，<br/>你自有你的花期。</p></article><article className="wish-panel"><span className="panel-no">03 — LOVE</span><Doodle kind="heart"/><h3>有人惦记，有所偏爱。</h3><p>愿所有的温柔与美好，<br/>都恰逢其时地来到你身边。</p></article></div>
        <button className="surprise-button" onClick={() => setSurprise(fortunes[Math.floor(Math.random() * fortunes.length)])}><Gift size={16}/><span>还有一份小惊喜，拆开看看</span><ArrowUpRight size={16}/></button>
      </section>
      <section id="wishes" className="wishes-section"><div className="section-wrap"><div className="section-heading"><div><span className="eyebrow"><span className="section-number">03 /</span> MAKE A WISH, LEAVE SOME LOVE</span><h2>让美好，在这里发生<span className="hand-heart">♡</span></h2><p>写下一个愿望，或留下一句祝福。每一份心意，都值得被珍藏。</p></div><div className="blessing-count"><Heart size={19}/><strong>{total.toString().padStart(2, "0")}</strong><span>份心意，正在被珍藏</span></div></div>
        <div className="wishes-layout"><form className="message-form" onSubmit={submitMessage}>
          <div className="form-tabs" role="group" aria-label="留言类型"><button type="button" className={kind === "message" ? "active" : ""} aria-pressed={kind === "message"} onClick={() => { setKind("message"); setSent(false); }}><Heart size={16}/>送上祝福</button><button type="button" className={kind === "wish" ? "active" : ""} aria-pressed={kind === "wish"} onClick={() => { setKind("wish"); setSent(false); }}><Star size={16}/>我的愿望</button></div>
          <label htmlFor="guest-name">怎么称呼你？<input id="guest-name" required maxLength={20} placeholder="留下你的名字或昵称" value={name} onChange={e => { setName(e.target.value); setSent(false); }}/></label>
          <label htmlFor="guest-message">{kind === "wish" ? "把愿望说给未来听" : `想对 ${board.name} 说的话`}<textarea id="guest-message" ref={contentRef} required rows={5} maxLength={300} placeholder={kind === "wish" ? "希望新的一岁，我可以……" : "愿你新的一岁，平安、自由、被爱……"} value={content} onChange={e => { setContent(e.target.value); setSent(false); }}/><span className="field-count">{content.length} / 300</span></label>
          <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
          <div className="quick-wishes">{(kind === "wish" ? ["勇敢出发", "健康快乐", "实现热爱"] : ["平安喜乐", "万事胜意", "快乐加倍"]).map((text, i) => <button type="button" key={text} onClick={() => { setContent((kind === "wish" ? ["愿新的一岁，有勇气出发，去看看更大的世界。", "希望我和我爱的人，都能健康、平安、快乐。", "愿新的一岁，能把热爱变成生活，让期待慢慢成真。"] : ["愿你新的一岁，平安喜乐，眼里有光，心中有爱。", "愿你所行皆坦途，所遇皆温柔，所念皆如愿。生日快乐！", "今天快乐，明天快乐，往后的每一天，都要加倍快乐！"])[i]); setSent(false); }}>+ {text}</button>)}</div>
          <div className="color-row"><span>选一张心意便签</span><div role="group" aria-label="便签颜色">{(["peach", "sage", "butter", "lavender"] as const).map((c, i) => <button type="button" key={c} className={`color-swatch ${c} ${color === c ? "selected" : ""}`} aria-label={["蜜桃粉", "鼠尾草绿", "奶油黄", "薰衣草紫"][i]} aria-pressed={color === c} onClick={() => setColor(c)}>{color === c && <Check size={13}/>}</button>)}</div></div>
          {formError && <p className="form-error" role="alert">{formError}</p>}{sent && <p className="form-success" role="status"><Check size={15}/> 已珍藏，刷新页面后也能看见。</p>}
          <button type="submit" className="button primary full-width" disabled={sending || !ready}>{sending ? <LoaderCircle size={17} className="spin"/> : <Send size={16}/>} {sending ? "正在珍藏…" : kind === "wish" ? "把愿望交给未来" : "把祝福留在这里"}</button><p className="form-footnote">{kind === "wish" ? "愿望会公开展示，和大家一起期待美好。" : "留言会展示在这里，让美好被看见。"}</p>
        </form>
        <div className="message-wall"><div className="wall-toolbar"><div role="group" aria-label="筛选心意">{([{ id: "all", label: "全部心意" }, { id: "message", label: "生日祝福" }, { id: "wish", label: "小小愿望" }] as const).map(item => <button key={item.id} className={filter === item.id ? "active" : ""} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div><button className="icon-button" aria-label="刷新留言" onClick={() => loadMessages()} disabled={wallBusy}><RefreshCw size={15} className={wallBusy ? "spin" : ""}/></button></div>
          {wallError && <div className="wall-error" role="alert"><p>{wallError}</p><button onClick={() => loadMessages()}>重新加载 <RefreshCw size={13}/></button></div>}
          <div className="notes-grid" aria-busy={wallBusy}>{displayedMessages.map(message => <article key={message.id} className={`note-card ${message.color}`}><div className="note-pin"/><div className="note-card-top"><span>{message.kind === "wish" ? <Star size={16}/> : <Heart size={16}/>}</span><small>{message.kind === "wish" ? "A LITTLE WISH" : "WITH ALL MY LOVE"}</small></div><p>{message.content}</p><div className="note-card-bottom"><span>{message.name}</span><small>{message.id.startsWith("builtin") ? "内置祝福" : new Date(message.createdAt).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit", timeZone: "Asia/Taipei" })}</small></div></article>)}
            {!messages.length && total === 0 && <div className="empty-note"><Bow/><p>第一份心意，<br/>等你写下。</p><span>YOUR WORDS MATTER.</span></div>}
          </div>
          {!messages.length && total > 0 && !wallBusy && !wallError && <div className="filter-empty"><Mail size={30}/><p>这里还没有{filter === "wish" ? "愿望" : "祝福"}，来写下第一句吧。</p></div>}
          {hasMore && <button className="load-more" onClick={() => loadMessages(messages.length)} disabled={wallBusy}>{wallBusy ? "正在打开更多心意…" : "再看看更多心意"}<ChevronDown size={16}/></button>}
          <p className="wall-footnote"><span/> {total === 0 ? "先送你三句内置祝福，期待你留下第一份心意。" : "每一份认真写下的心意，都被好好收藏。"}</p>
        </div></div>
      </div></section>
      <footer className="site-footer section-wrap"><Asterisk/><p className="footer-script">Here’s to you.</p><p>不止生日快乐，要每一天都快乐。</p><div className="footer-bottom"><a className="footer-brand" href="#home">今日偏爱 <Heart size={11}/><span>MADE WITH LOVE, JUST FOR YOU.</span></a><button onClick={() => { setShare(true); setCopied(false); }}>分享这份快乐 <ArrowUpRight size={15}/></button><a href="#home" className="back-top">回到顶部 ↑</a></div></footer>
      </>}
    </main>
    {customize && <Customize board={board} owned={!!editToken} onSave={saveConfig} onClose={() => setCustomize(false)}/>}
    {share && <Modal title="分享生日祝福" onClose={() => setShare(false)} className="share-modal"><div className="share-illustration"><Mail size={46} strokeWidth={1}/><Heart size={18}/></div><span className="eyebrow">SEND A LITTLE LOVE</span><h2>把这份快乐，<br/>送到 TA 身边。</h2><p>复制链接，发送给今天最特别的人。</p><label className="share-link-label">祝福页链接<input readOnly value={typeof window !== "undefined" ? window.location.origin + (board.id === "demo" ? "/" : `/?id=${board.id}`) : ""} onFocus={e => e.currentTarget.select()}/></label><button className="button primary full-width" onClick={copyShare}>{copied ? <Check size={17}/> : <Copy size={17}/>} {copied ? "已复制，去传递快乐吧" : "复制祝福链接"}</button></Modal>}
    {surprise && <Modal title="给你的生日幸运签" onClose={() => setSurprise(null)} className="surprise-modal"><Sparkles size={32}/><span className="eyebrow">A LITTLE BIRTHDAY FORTUNE</span><h2>今日，上上签。</h2><p className="fortune-text">{surprise}</p><div className="fortune-line"/><span className="handwritten">Good things are coming.</span><button className="button primary" onClick={() => { setSurprise(null); setConfetti(Date.now()); }}>收下这份好运 <Heart size={16}/></button></Modal>}
    {toast && <div className={`toast ${toast.error ? "error" : ""}`} role="status"><Heart size={16}/><span>{toast.text}</span><button aria-label="关闭提示" onClick={() => setToast(null)}><X size={14}/></button></div>}
    {!!confetti && <div className="confetti" aria-hidden="true" key={confetti}>{Array.from({ length: 64 }, (_, i) => <i key={i} style={{ "--x": `${(i * 37 + 11) % 100}vw`, "--delay": `${(i % 9) * .05}s`, "--rotate": `${i * 57}deg`, "--drift": `${(i % 2 ? 1 : -1) * (40 + i % 100)}px`, background: ["#c05a49", "#d1b05e", "#7b9276", "#dba19e", "#beadcf"][i % 5], borderRadius: i % 3 ? "1px" : "50%" } as CSSProperties}/>)}</div>}
  </div>;
}
