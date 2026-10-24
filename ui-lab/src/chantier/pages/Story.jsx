// Entry page — the approved « Chantier » direction, told like a construction schedule:
// hero + Gantt, film that grows (Video Scroll Hero), 26 tasks → 3 domains, the critical path lights up,
// deliverables scroll sideways (Horizontal Scroll Gallery), the honest ring, people (Reveal Image Mask),
// trainers (Scroll Reveal Image), film CTA. Motion: GSAP ScrollTrigger + Lenis; reduced motion = final states.
import React, { useEffect, useState } from 'react'
import { gsap, ScrollTrigger, useGsap, useLenis } from '../motion.js'
import { readiness, DOMAINS, LEVERS } from '../../data.js'
import ScrollProgress from '../components/21st/ScrollProgress.jsx'
import Reveal from '../components/21st/Reveal.jsx'
import VideoScrollHero from '../components/21st/VideoScrollHero.jsx'
import HorizontalScrollGallery from '../components/21st/HorizontalScrollGallery.jsx'
import RevealImageMask from '../components/21st/RevealImageMask.jsx'
import ScrollRevealImage from '../components/21st/ScrollRevealImage.jsx'
import Film from '../components/Film.jsx'
import { Brand } from '../components/Chrome.jsx'

const M = (f) => `${import.meta.env.BASE_URL}media/${f}`
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim()

/* ---------- hero Gantt (data from the reference page) ---------- */
const ROWS = [['Diagnostic', 0, 0.8, 'process'], ['Personnes', 0.6, 2.4, 'people'], ['Processus', 1.2, 3.6, 'process'], ['Gérer les risques', 1.8, 3.4, 'accent'], ['Échéancier', 3.4, 4.6, 'accent'], ["Env. d'affaires", 2.4, 4.8, 'biz'], ['Examen blanc', 5.0, 5.9, 'fg']]
const X0 = 150, W = 390, WK = W / 6, R0 = 34, RH = 40
function Gantt({ t }) {
  const color = (c) => c === 'accent' ? 'var(--accent)' : c === 'fg' ? 'var(--fg)' : `var(--${c})`
  return (
    <svg id="gantt" viewBox="0 0 560 330" role="img" aria-labelledby="gantt-t">
      <title id="gantt-t">{t('Sept lots de travail répartis sur six semaines, le lot critique en ambre', 'Seven work packages over six weeks, the critical one in amber')}</title>
      {Array.from({ length: 7 }, (_, w) => <g key={w}><line x1={X0 + w * WK} x2={X0 + w * WK} y1={18} y2={R0 + ROWS.length * RH - 6} stroke="var(--line)" strokeWidth="1" />{w < 6 && <text x={X0 + w * WK + 6} y={14} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--muted)">S{w + 1}</text>}</g>)}
      {ROWS.map(([label, a, b, c], i) => <g key={label}><text x={0} y={R0 + i * RH + 17} fontFamily="Public Sans, sans-serif" fontSize="13" fill="var(--fg)">{label}</text><rect className="gantt-bar" x={X0 + a * WK} y={R0 + i * RH + 4} width={(b - a) * WK} height={18} rx={9} fill={color(c)} /></g>)}
      <path className="gantt-link" d={`M ${X0 + 3.4 * WK} ${R0 + 3 * RH + 13} C ${X0 + 3.5 * WK} ${R0 + 3 * RH + 30}, ${X0 + 3.3 * WK} ${R0 + 4 * RH - 6}, ${X0 + 3.4 * WK + 2} ${R0 + 4 * RH + 6}`} fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 4" />
      <g className="gantt-today" transform={`translate(${X0 + 2.3 * WK},0)`}><line x1={0} x2={0} y1={22} y2={R0 + ROWS.length * RH - 4} stroke="var(--fg)" strokeWidth="1.5" /><circle cx={0} cy={22} r={4} fill="var(--fg)" /><text x={6} y={R0 + ROWS.length * RH - 8} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--fg)">{t("aujourd'hui", 'today')}</text></g>
    </svg>
  )
}

/* ---------- scene 1: 26 dots ---------- */
const GROUPS = [{ id: 'people', n: 8, cx: 120 }, { id: 'process', n: 10, cx: 320 }, { id: 'biz', n: 8, cx: 520 }]
const DOTS = (() => { let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); const out = []; GROUPS.forEach((gr) => { const cols = 2, gap = 46, rowsN = Math.ceil(gr.n / cols); for (let i = 0; i < gr.n; i++) { const col = i % cols, row = Math.floor(i / cols); out.push({ id: gr.id, fx: gr.cx + (col - 0.5) * gap + (row % 2 ? 10 : -10), fy: 470 - (rowsN - 1 - row) * gap - 20, sx: 30 + rnd() * 580, sy: 30 + rnd() * 400 }) } }); return out })()

/* ---------- scene 2: PERT ---------- */
const N = { S: [40, 220, 'Diagnostic'], R: [190, 120, 'Risques'], I: [190, 330, 'Intégration'], E: [340, 120, 'Échéancier'], Q: [340, 330, 'Qualité'], F: [480, 200, 'Finances'], C: [480, 360, 'Communication'], P: [600, 120, 'Parties prenantes'], X: [620, 300, 'Examen'] }
const EDGES = [['S', 'R', 1], ['S', 'I', 0], ['R', 'E', 1], ['I', 'Q', 0], ['I', 'E', 0], ['E', 'F', 1], ['Q', 'F', 0], ['Q', 'C', 0], ['F', 'P', 1], ['C', 'X', 0], ['P', 'X', 1]]
const CRIT = ['S', 'R', 'E', 'F', 'P', 'X']
const SEQ = [['S', 'R'], ['R', 'E'], ['E', 'F'], ['F', 'P'], ['P', 'X']]

const STEPS = LEVERS.map((l, i) => ({ id: l.id, fr: l.fr, en: l.en, gain: `+${(4.1 - i * 0.8).toFixed(1).replace('.', ',')} pts`, locked: i >= 2 }))
const RR = 160, CIRC = 2 * Math.PI * RR

export default function Story({ reduced, motion }) {
  const [lang, setLang] = useState('fr')
  const t = (fr, en) => (lang === 'en' && en ? en : fr)
  const r = readiness()
  const READY = Math.round(r.score * 100)
  useLenis(!reduced)
  useEffect(() => { document.documentElement.lang = lang; ScrollTrigger.refresh() }, [lang])

  const root = useGsap((el) => {
    if (reduced) return
    ScrollTrigger.create({ start: 8, end: 'max', toggleClass: { targets: '#bar', className: 'scrolled' } })
    // hero load sequence (one entrance)
    const heroTl = gsap.timeline({ defaults: { ease: 'expo.out' } })
    heroTl.from('.hero h1 .ln > span', { yPercent: 110, duration: 1.15, stagger: 0.09 })
      .fromTo('.hero h1 .site', { '--u': 0 }, { '--u': 1, duration: 0.9, ease: 'power3.inOut' }, '-=0.55')
      .from('.hero .eyebrow, .hero .lead, .hero-cta, .facts > div', { y: 18, opacity: 0, filter: 'blur(8px)', duration: 0.8, stagger: 0.06 }, '-=1.0')
      .from('.gantt-bar', { attr: { width: 0 }, duration: 1.0, stagger: 0.07, ease: 'power4.out' }, 0.25)
      .from('.gantt-link', { opacity: 0, duration: 0.6 }, '-=0.3')
    gsap.to('.gantt-today', { attr: { transform: `translate(${X0 + 2.9 * WK},0)` }, duration: 6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.6 })
    gsap.to('.hero-media .gantt', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
    gsap.fromTo('.hero-photo img', { scale: 1.12, yPercent: -4 }, { scale: 1.02, yPercent: 4, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })

    const mm = gsap.matchMedia()
    mm.add({ desk: '(min-width: 961px)', mob: '(max-width: 960px)' }, (ctx) => {
      const { desk } = ctx.conditions
      const pinLen = desk ? '+=140%' : '+=110%'
      // scene 1: scattered → three domains
      const t1 = gsap.timeline({ scrollTrigger: { trigger: '[data-pin="tasks"]', start: 'top top', end: pinLen, scrub: 0.8, pin: true } })
      el.querySelectorAll('#dots circle[data-fx]').forEach((c, i) => t1.to(c, { attr: { cx: +c.dataset.fx, cy: +c.dataset.fy, fill: css('--' + c.dataset.id) }, duration: 1, ease: 'power3.inOut' }, (i % 13) * 0.025))
      el.querySelectorAll('#taches .count').forEach((n) => { const o = { v: 0 }; t1.fromTo(o, { v: 0 }, { v: +n.dataset.to, duration: 0.8, ease: 'power2.out', onUpdate: () => (n.textContent = Math.round(o.v)) }, 0.3) })
      // scene 2: the critical path draws and lights four steps
      const t2 = gsap.timeline({ scrollTrigger: { trigger: '[data-pin="path"]', start: 'top top', end: desk ? '+=180%' : '+=140%', scrub: 0.8, pin: true } })
      const node = (k) => el.querySelector(`#pert [data-node="${k}"]`)
      const edge = (a, b) => el.querySelector(`#pert [data-edge="${a}${b}"]`)
      el.querySelectorAll('#pert path[data-crit="1"]').forEach((p) => { const len = p.getTotalLength(); p.style.strokeDasharray = len; p.style.strokeDashoffset = len })
      t2.to(node('S'), { attr: { fill: css('--accent'), stroke: css('--accent') }, duration: 0.2 })
      SEQ.forEach(([a, b]) => { t2.to(edge(a, b), { strokeDashoffset: 0, duration: 1, ease: 'none' }).to(node(b), { attr: { fill: css('--accent'), stroke: css('--accent'), r: b === 'X' ? 18 : 15 }, duration: 0.25, ease: 'back.out(3)' }) })
      const steps = [...el.querySelectorAll('.steps li')]; const segDur = 1.25, head = 0.2, total = head + SEQ.length * segDur
      t2.eventCallback('onUpdate', () => steps.forEach((li, i) => li.classList.toggle('on', t2.progress() >= (head + segDur * (i + 1)) / total)))
      // scene 4: the ring fills to the honest value and stops
      const arc = el.querySelector('#ring-arc'), val = el.querySelector('#ringval'); const o = { v: 0 }
      gsap.set(arc, { attr: { 'stroke-dashoffset': CIRC } })
      gsap.timeline({ scrollTrigger: { trigger: '[data-pin="ring"]', start: 'top top', end: desk ? '+=110%' : '+=90%', scrub: 0.8, pin: true } })
        .to(o, { v: READY, duration: 1, ease: 'power2.inOut', onUpdate: () => { val.textContent = Math.round(o.v); arc.setAttribute('stroke-dashoffset', CIRC * (1 - o.v / 100)) } })
        .from('.truths p', { x: -14, opacity: 0, stagger: 0.18, duration: 0.4 }, 0.55)
      return () => {}
    })
    el.querySelectorAll('.meter i').forEach((m) => gsap.from(m, { scaleX: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: m, start: 'top 90%', once: true } }))
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [reduced])

  // deliverables: per-doc entrances driven by the gallery's containerAnimation (as in the 21st gallery demo)
  const onGallery = (hz) => {
    if (reduced || !root.current) return
    const ctx = gsap.context(() => {
      const ph = root.current.querySelector('.doc.photo')
      if (ph) gsap.fromTo(ph, { clipPath: 'inset(0 0 100% 0 round 16px)' }, { clipPath: 'inset(0 0 0% 0 round 16px)', duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.hz', start: 'top 60%', toggleActions: 'play none none reverse' } })
      root.current.querySelectorAll('.doc:not(.photo)').forEach((doc) => {
        const st = { trigger: doc, containerAnimation: hz, start: 'left 82%', toggleActions: 'play none none reverse' }
        gsap.from(doc.querySelectorAll('.row, tr, .node'), { scaleX: 0, opacity: 0, transformOrigin: '0 50%', stagger: 0.05, duration: 0.6, ease: 'power3.out', scrollTrigger: st })
        gsap.from(doc.querySelector('.stamp, .lvl'), { scale: 1.6, opacity: 0, rotate: -12, duration: 0.5, delay: 0.35, ease: 'back.out(2.4)', scrollTrigger: { ...st } })
        gsap.fromTo(doc, { rotate: 2.5, y: 30 }, { rotate: 0, y: 0, ease: 'none', scrollTrigger: { trigger: doc, containerAnimation: hz, start: 'left right', end: 'left 40%', scrub: true } })
      })
    }, root)
    return () => ctx.revert()
  }


  return (
    <div className="story" ref={root}>
      <ScrollProgress reduced={reduced} />
      <a className="skip" href="#main">Aller au contenu</a>
      <header className="bar" id="bar">
        <div className="wrap bar-in">
          <Brand href="#/" size={30} />
          <nav className="nav" aria-label="Sections">
            <a href="#taches">{t('Les 26 tâches', 'The 26 tasks')}</a><a href="#chemin">{t('Chemin critique', 'Critical path')}</a><a href="#projet">{t('Votre projet', 'Your project')}</a><a href="#formateurs">{t('Formateurs', 'Trainers')}</a>
          </nav>
          <div className="lang" role="group" aria-label="Langue">
            <button type="button" aria-pressed={lang === 'fr'} onClick={() => setLang('fr')}>FR</button><button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
          </div>
          <a className="btn btn-primary" href="#/aujourdhui">{t('Commencer', 'Start')}</a>
        </div>
      </header>

      <main id="main">
        <section className="wrap hero" aria-labelledby="hero-title">
          <div>
            <p className="eyebrow">{t('Préparation PMP · ECO 2026', 'PMP exam prep · ECO 2026')}</p>
            <h1 id="hero-title" style={{ marginTop: 18 }}>
              <span className="ln"><span>{t('Préparez le PMP', 'Prepare the PMP')}</span></span>
              <span className="ln"><span>{t('sur votre vrai', 'on your real')}</span></span>
              <span className="ln"><span className="site">{t('chantier.', 'project.')}</span></span>
            </h1>
            <p className="lead">{t("Une préparation adaptative et bilingue, fidèle au plan d'examen 2026. Vous vous entraînez sur votre propre projet, et votre indice de préparation n'est jamais gonflé.", 'Adaptive, bilingual preparation built on the 2026 exam outline. You practise on your own project, and your readiness score is never inflated.')}</p>
            <div className="hero-cta">
              <a className="btn btn-primary" href="#/aujourdhui">{t('Faire mon diagnostic', 'Take my diagnostic')} <span className="arr" aria-hidden="true">→</span></a>
              <a className="btn btn-ghost" href="#chemin">{t('Voir comment ça marche', 'See how it works')}</a>
            </div>
            <div className="facts">
              <div><b>26</b><span>{t('tâches ECO 2026', 'ECO 2026 tasks')}</span></div>
              <div><b>33 · 41 · 26</b><span>{t('poids des domaines, %', 'domain weights, %')}</span></div>
              <div><b>FR / EN</b><span>{t('partout', 'everywhere')}</span></div>
            </div>
          </div>
          <div className="hero-media">
            <div className="hero-photo"><img src={M('site-engineer.webp')} alt={t('Une ingénieure en casque et gilet de sécurité consulte un plan sur sa tablette devant un chantier au coucher du soleil', 'An engineer in a hard hat and safety vest checks a plan on her tablet in front of a construction site at sunset')} width="1000" height="1241" fetchPriority="high" /></div>
            <figure className="gantt" aria-label={t("Exemple d'échéancier de préparation sur six semaines", 'Example six-week preparation schedule')}>
              <div className="gantt-head"><p className="gantt-title">{t('Votre échéancier de préparation', 'Your preparation schedule')}</p><span className="tag">{t('Exemple', 'Example')}</span></div>
              <Gantt t={t} />
            </figure>
          </div>
        </section>

        <VideoScrollHero src={M('site.mp4')} poster={M('site-poster.webp')} reduced={reduced} label={t('Votre projet sert de manuel', 'Your project is the textbook')}>
          <p className="eyebrow">{t('Votre projet sert de manuel', 'Your project is the textbook')}</p>
          <h2 id="treel">{t('Chaque notion PMP, reliée à un vrai chantier.', 'Every PMP notion, tied to a real worksite.')}</h2>
          <p>{t('Risques, échéancier, parties prenantes : vous les révisez sur le projet que vous menez vraiment.', 'Risks, schedule, stakeholders: you revise them on the project you actually run.')}</p>
        </VideoScrollHero>

        {/* Scene 1 */}
        <section className="scene" id="taches" aria-labelledby="t1">
          <div className="wrap stage" data-pin="tasks">
            <div className="scene-grid">
              <div className="scene-copy">
                <p className="eyebrow">{t("Le plan de l'examen", 'The exam blueprint')}</p>
                <h2 id="t1">{t('26 tâches. Trois domaines.', '26 tasks. Three domains.')}</h2>
                <p className="lead">{t("Chaque question que vous traitez est rattachée à l'une des 26 tâches de l'ECO 2026, pondérée exactement comme le jour de l'examen.", 'Every question you answer is tied to one of the 26 tasks of the ECO 2026, weighted exactly as on exam day.')}</p>
                <div className="weights">
                  {DOMAINS.map((d) => <div className="weight" key={d.id}><b style={{ color: `var(--${d.id === 'business' ? 'biz' : d.id}-ink)` }}><span className="count" data-to={Math.round(d.weight * 100)}>{reduced ? Math.round(d.weight * 100) : 0}</span> %</b><span>{t(d.fr, d.en)}</span></div>)}
                </div>
              </div>
              <svg className="viz" id="dots" viewBox="0 0 640 520" role="img" aria-label={t("26 points qui se regroupent en trois domaines : 8 tâches Personnes, 10 Processus, 8 Environnement d'affaires", '26 dots gathering into three domains: 8 People tasks, 10 Process, 8 Business Environment')}>
                {DOTS.map((d, i) => <circle key={i} cx={reduced ? d.fx : d.sx} cy={reduced ? d.fy : d.sy} r="15" fill={reduced ? `var(--${d.id})` : 'var(--line)'} data-fx={d.fx} data-fy={d.fy} data-id={d.id} />)}
                {GROUPS.map((gr) => <line key={gr.id} x1={gr.cx - 60} x2={gr.cx + 60} y1="500" y2="500" stroke="var(--line)" strokeWidth="2" />)}
              </svg>
            </div>
          </div>
        </section>

        {/* Scene 2 */}
        <section className="scene" id="chemin" aria-labelledby="t2">
          <div className="wrap stage" data-pin="path">
            <div className="scene-grid">
              <div className="scene-copy">
                <p className="eyebrow">{t('Votre chemin critique', 'Your critical path')}</p>
                <h2 id="t2">{t('Quatre étapes. Dans le bon ordre.', 'Four steps. In the right order.')}</h2>
                <p className="lead">{t("Certifizer repère les tâches qui freinent toute votre préparation, puis les ordonne pour que chacune débloque la suivante.", 'Certifizer finds the tasks that hold back your whole preparation, then orders them so each one unlocks the next.')}</p>
                <ol className="steps" aria-label={t('Étapes du chemin critique (exemple)', 'Critical path steps (example)')}>
                  {STEPS.map((s, i) => <li key={s.id} className={`${reduced ? 'on ' : ''}${s.locked ? 'locked' : ''}`}><span className="n">{i + 1}</span><span className="t">{t(s.fr, s.en)}</span><span className="g">{s.gain}</span>{s.locked && <span className="prem">Premium</span>}</li>)}
                </ol>
              </div>
              <svg className="viz" id="pert" viewBox="0 0 660 440" role="img" aria-label={t("Réseau de tâches : le chemin critique s'allume en ambre, du diagnostic à l'examen", 'Task network: the critical path lights up in amber, from diagnostic to exam')}>
                {EDGES.map(([a, b, crit]) => { const [x1, y1] = N[a], [x2, y2] = N[b]; const mx = (x1 + x2) / 2; return <path key={a + b} data-edge={a + b} data-crit={crit} d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`} fill="none" stroke={crit ? 'var(--accent)' : 'var(--line)'} strokeWidth={crit ? 4 : 2} strokeLinecap="round" /> })}
                {Object.entries(N).map(([k, [x, y, label]]) => { const crit = CRIT.includes(k); const lit = reduced && crit; return <g key={k}><circle data-node={k} cx={x} cy={y} r={lit ? (k === 'X' ? 18 : 15) : k === 'S' || k === 'X' ? 14 : 11} fill={lit ? 'var(--accent)' : 'var(--bg)'} stroke={lit ? 'var(--accent)' : crit ? 'var(--fg)' : 'var(--line)'} strokeWidth="2.5" /><text x={x} y={y - 22} textAnchor="middle" fontFamily="Public Sans, sans-serif" fontSize="14" fontWeight="600" fill={crit ? 'var(--fg)' : 'var(--muted)'}>{label}</text></g> })}
              </svg>
            </div>
          </div>
        </section>

        {/* Scene 3: deliverables, horizontal */}
        <div id="projet">
        <HorizontalScrollGallery reduced={reduced} onAnimation={onGallery} aria-labelledby="t3" intro={(
          <div className="wrap hz-intro">
            <div className="scene-copy">
              <p className="eyebrow">{t('Relier à mon projet', 'Relate to my project')}</p>
              <h2 id="t3">{t('Réviser en produisant du vrai travail.', 'Revision that produces real work.')}</h2>
              <p className="lead">{t('Vous décrivez votre projet. Vous en sortez avec de vrais livrables PMP, évalués selon des grilles PMI et validés par votre formateur.', 'You describe your project. You come out with real PMP deliverables, reviewed against PMI rubrics and validated by your trainer.')}</p>
              <span className="tag" style={{ justifySelf: 'start' }}>{t('Exemple : projet de station de pompage', 'Example: pumping station project')}</span>
            </div>
            <div className="hz-film"><Film src={M('board.mp4')} poster={M('board-poster.webp')} reduced={reduced} /></div>
          </div>
        )}>
          <figure className="doc photo" style={{ margin: 0 }}>
            <img src={M('team-roadmap.webp')} alt={t('Une équipe projet annote une feuille de route imprimée avec des notes adhésives', 'A project team annotates a printed roadmap with sticky notes')} width="1000" height="1241" loading="lazy" />
            <figcaption>{t('Votre équipe, votre feuille de route', 'Your team, your roadmap')}</figcaption>
          </figure>
          <article className="doc" aria-label="Charte de projet">
            <div className="meta mono"><span>DOC-01</span><span>v3</span></div><h3>Charte de projet</h3>
            <div className="body"><div className="row k" style={{ width: '42%' }} /><div className="row" style={{ width: '96%' }} /><div className="row" style={{ width: '88%' }} /><div className="row" style={{ width: '70%' }} /><div className="row k" style={{ width: '36%', marginTop: 10 }} /><div className="row" style={{ width: '92%' }} /><div className="row" style={{ width: '80%' }} /><div className="row k" style={{ width: '48%', marginTop: 10 }} /><div className="row" style={{ width: '84%' }} /></div>
            <span className="stamp">Validé · formateur</span>
          </article>
          <article className="doc" aria-label="Registre des risques">
            <div className="meta mono"><span>DOC-02</span><span>v2</span></div><h3>Registre des risques</h3>
            <div className="body"><table><thead><tr><th>Risque</th><th>P×I</th><th>Réponse</th></tr></thead><tbody><tr><td>Retard livraison pompes</td><td className="mono">0,6</td><td>Atténuer</td></tr><tr><td>Crue en saison</td><td className="mono">0,4</td><td>Éviter</td></tr><tr><td>Permis tardif</td><td className="mono">0,3</td><td>Transférer</td></tr><tr><td>Hausse de l'acier</td><td className="mono">0,3</td><td>Accepter</td></tr></tbody></table></div>
            <span className="lvl">Niveau 3 · infléchit une décision</span>
          </article>
          <article className="doc" aria-label="Structure de découpage du projet">
            <div className="meta mono"><span>DOC-03</span><span>v1</span></div><h3>WBS</h3>
            <div className="body wbs"><div className="node">1. Station de pompage</div><div className="kids"><div className="node">1.1 Génie civil</div><div className="node">1.2 Équipements</div><div className="node">1.3 Mise en service</div></div><div className="kids"><div className="node">1.1.1 Fondations</div><div className="node">1.2.1 Pompes</div><div className="node">1.3.1 Essais</div></div></div>
            <span className="lvl">Niveau 2 · décrit</span>
          </article>
          <article className="doc" aria-label="Plan de communication">
            <div className="meta mono"><span>DOC-04</span><span>v1</span></div><h3>Plan de communication</h3>
            <div className="body"><table><thead><tr><th>Partie prenante</th><th>Canal</th><th>Rythme</th></tr></thead><tbody><tr><td>Maître d'ouvrage</td><td>Comité</td><td className="mono">Mensuel</td></tr><tr><td>Riverains</td><td>Réunion</td><td className="mono">Trimestriel</td></tr><tr><td>Équipe chantier</td><td>Point</td><td className="mono">Quotidien</td></tr></tbody></table></div>
            <span className="lvl">En cours</span>
          </article>
        </HorizontalScrollGallery>
        </div>

        {/* Scene 4: honest portrait */}
        <section className="mirror" aria-labelledby="t4">
          <div className="wrap stage" data-pin="ring">
            <div className="scene-grid">
              <div className="scene-copy">
                <p className="eyebrow">{t('Votre portrait', 'Your portrait')}</p>
                <h2 id="t4">{t('Un miroir, pas un trophée.', 'A mirror, not a trophy.')}</h2>
                <p className="lead">{t('Votre indice ne compte que ce que vos réponses prouvent. Une tâche jamais travaillée compte pour zéro.', 'Your readiness score counts only what your answers prove. A task you have never practised counts for zero.')}</p>
                <div className="truths">
                  <p>{t("Il n'est jamais arrondi pour vous rassurer.", 'It never rounds up to reassure you.')}</p>
                  <p>{t("Il peut redescendre quand une compétence s'efface.", 'It can go down when a skill fades.')}</p>
                  <p>{t('Il nomme toujours la prochaine tâche à travailler.', 'It always names the next task to work on.')}</p>
                </div>
              </div>
              <div className="ring-wrap">
                <svg className="viz" viewBox="0 0 400 400" aria-hidden="true">
                  <circle cx="200" cy="200" r={RR} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="26" />
                  {[50, 70, 85].map((v) => { const a = (v / 100) * Math.PI * 2 - Math.PI / 2; return <g key={v}><line x1={200 + Math.cos(a) * (RR - 20)} y1={200 + Math.sin(a) * (RR - 20)} x2={200 + Math.cos(a) * (RR + 20)} y2={200 + Math.sin(a) * (RR + 20)} stroke="rgba(255,255,255,.45)" strokeWidth="2" /><text x={200 + Math.cos(a) * (RR + 34)} y={200 + Math.sin(a) * (RR + 34) + 4} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="rgba(255,255,255,.6)">{v}</text></g> })}
                  <circle id="ring-arc" cx="200" cy="200" r={RR} fill="none" stroke="var(--accent)" strokeWidth="26" strokeLinecap="round" transform="rotate(-90 200 200)" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - READY / 100)} />
                </svg>
                <div className="ring-num" role="img" aria-label={t(`Préparation estimée : ${READY} %, ${r.label.fr.toLowerCase()} (exemple)`, `Estimated readiness: ${READY}%, ${r.label.en.toLowerCase()} (example)`)}><b><span id="ringval">{READY}</span> %</b><span>{t(`${r.label.fr} · exemple`, `${r.label.en} · example`)}</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="wrap people" aria-labelledby="tpeople">
          <Reveal className="scene-copy" reduced={reduced}>
            <p className="eyebrow">{t('Pour qui', 'Who it is for')}</p>
            <h2 id="tpeople">{t('Ceux qui mènent de vrais projets.', 'People who run projects for real.')}</h2>
          </Reveal>
          <div className="people-grid">
            <RevealImageMask reduced={reduced} src={M('colleagues.webp')} width="1000" height="1241" alt={t("Deux collègues échangent autour d'un document et d'une tablette", 'Two colleagues discuss a document and a tablet')} caption={<><b>{t('En binôme ou en cohorte', 'In pairs or in a cohort')}</b><span>{t('Votre formateur suit le groupe, tâche par tâche.', 'Your trainer follows the group, task by task.')}</span></>} />
            <RevealImageMask reduced={reduced} src={M('scenario.webp')} width="1000" height="1241" alt={t('Une cheffe de projet réfléchit devant un scénario sur son ordinateur', 'A project manager thinks through a scenario on her computer')} caption={<><b>{t('Quinze minutes quand vous pouvez', 'Fifteen minutes when you can')}</b><span>{t('Des séances courtes, construites sur vos erreurs récentes.', 'Short sessions built from your recent mistakes.')}</span></>} />
            <RevealImageMask reduced={reduced} src={M('learner.webp')} width="1000" height="1241" alt={t('Un ingénieur révise à son bureau avec un carnet de notes', 'An engineer revises at his desk with a notebook')} caption={<><b>{t('Sur votre propre projet', 'On your own project')}</b><span>{t('Chaque notion appliquée au travail sur votre bureau.', 'Each notion applied to the work on your desk.')}</span></>} />
          </div>
          <p className="ph-note">{t("Photos d'illustration", 'Illustrative photos')}</p>
        </section>

        <section className="wrap trainers" id="formateurs" aria-labelledby="t5">
          <Reveal className="scene-copy" reduced={reduced}>
            <p className="eyebrow">{t('Pour les formateurs', 'For trainers')}</p>
            <h2 id="t5">{t('Voyez ce qui freine la cohorte.', 'See what holds the cohort back.')}</h2>
            <p className="lead">{t('Chaque matin, un brief : les sujets qui bloquent le groupe, qui accompagner, et un clic pour assigner une séance ciblée.', 'Each morning, one brief: the topics blocking the group, who needs support, and one click to assign a targeted session.')}</p>
            <div style={{ marginTop: 24 }}><ScrollRevealImage reduced={reduced} src={M('trainer.webp')} width="1000" height="1241" height="46vh" alt={t('Une formatrice présente le tableau de bord de la cohorte à six apprenants', 'A trainer presents the cohort dashboard to six learners')} /></div>
          </Reveal>
          <Reveal className="cohort" reduced={reduced} index={1} aria-label={t('Exemple de cohorte PMP-2026-A', 'Example cohort PMP-2026-A')}>
            <div className="gantt-head"><p className="mono" style={{ fontSize: 13, fontWeight: 600 }}>Cohorte PMP-2026-A · 18 apprenant·es</p><span className="tag">{t('Exemple', 'Example')}</span></div>
            {[['Gérer les risques', 39, 'biz'], ['Échéancier', 46, 'process'], ['Parties prenantes', 52, 'people'], ['Gouvernance', 61, 'biz']].map(([l, v, c]) => <div className="cohort-row" key={l}><span>{l}</span><span className="meter" role="img" aria-label={`${l} : ${v} %`}><i style={{ width: `${v}%`, background: `var(--${c})` }} /></span><span className="mono">{v} %</span></div>)}
            <a className="btn btn-ghost" href="#/aujourdhui" style={{ justifySelf: 'start' }}>{t('Créer une séance ciblée', 'Create a targeted session')}</a>
          </Reveal>
        </section>

        <section className="cta-film" id="commencer" aria-labelledby="t6">
          <Film src={M('pm.mp4')} poster={M('pm-poster.webp')} reduced={reduced} />
          <div className="wrap cta">
            <Reveal as="p" className="eyebrow" reduced={reduced}>{t('Quinze minutes suffisent', 'Fifteen minutes is enough')}</Reveal>
            <Reveal as="h2" id="t6" reduced={reduced} index={1}>{t('Commencez là où vous en êtes vraiment.', 'Start where you really are.')}</Reveal>
            <Reveal className="hero-cta" reduced={reduced} index={2}>
              <a className="btn btn-primary" href="#/aujourdhui">{t('Faire mon diagnostic', 'Take my diagnostic')} <span className="arr" aria-hidden="true">→</span></a>
              <a className="btn btn-ghost" href="#formateurs">{t('Accès formateur', 'Trainer access')}</a>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="wrap">
        <span>{t("Aperçu visuel avec données d'exemple. Rien n'est enregistré.", 'Visual preview with sample data. Nothing here is saved.')}</span>
        <span className="mono">Motion : GSAP ScrollTrigger · Lenis · composants 21st.dev adaptés : « Reveal » (@asanshay), « Scroll Progress » (@cnippet-dev), « Horizontal Scroll Gallery » (@pulkitxm), « Video Scroll Hero » (@isaiahbjork), « Reveal Image Mask » (@daiwiikharihar), « Scroll Reveal Image » (@unlumen). Photos et films générés pour l'illustration.</span>
        <button type="button" className="link" onClick={() => motion.toggle()} aria-pressed={motion.toggled}>{motion.toggled ? 'Réactiver les animations' : 'Réduire les animations'}</button>
      </footer>
    </div>
  )
}
