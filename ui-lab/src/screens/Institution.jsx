import React from 'react'
import { Building2, Users, CalendarDays, AlertTriangle } from 'lucide-react'
import { COHORT } from '../data.js'
import { pct, Meter, Callout, Vignette } from '../ui.jsx'

export default function Institution({ state }) {
  const full = state === 'Sièges épuisés'
  const used = full ? 20 : 14
  const cohorts = [{ code: 'PMP-2026-A', n: 14, mean: 0.61, exam: '14 nov. 2026', ready: 3 }, { code: 'PMP-2026-B', n: full ? 6 : 0, mean: 0.0, exam: '20 mars 2027', ready: 0 }]
  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <div className="page-head"><div><div className="label">Vue institution · proposition</div><h1>Deux cohortes, vingt sièges, une seule mesure.</h1></div><span className="chip chip-outline">N’existe pas encore dans le produit</span></div>
      <p className="lead" style={{ marginBottom: 'var(--s-6)' }}>L’institution voit ce que voient ses formateurs, agrégé : préparation moyenne, apprenants prêts, sièges consommés. Jamais le détail d’un apprenant : cela reste au formateur.</p>
      {full && <Callout kind="warm" icon={AlertTriangle}>Vos 20 sièges sont tous attribués. Les prochaines invitations seront refusées jusqu’au renouvellement du 1er janvier ou à l’ajout de sièges.</Callout>}
      <div className="grid-3" style={{ marginTop: full ? 'var(--s-5)' : 0 }}>
        <div className="card"><div className="label">Sièges</div><div className={`display num ${full ? 'tier-1' : ''}`} style={{ fontSize: 'var(--t-3xl)', marginTop: 4 }}>{used} / 20</div><Meter value={used / 20} tier={full ? 1 : 3} /><div className="small subtle" style={{ marginTop: 6 }}>Renouvellement le 1er janvier 2027</div></div>
        <div className="card"><div className="label">Préparation moyenne</div><div className="display num tier-2" style={{ fontSize: 'var(--t-3xl)', marginTop: 4 }}>61 %</div><div className="small subtle">indicateur Certifizer · cohorte A</div></div>
        <div className="card"><div className="label">Prêt·es pour l’examen</div><div className="display num tier-4" style={{ fontSize: 'var(--t-3xl)', marginTop: 4 }}>3</div><div className="small subtle">≥ 85 % · cohorte A</div></div>
      </div>
      <section className="section">
        <h2>Cohortes</h2>
        <div className="table-wrap" tabIndex={0} aria-label="Tableau, défilement horizontal possible" style={{ marginTop: 12 }}><table className="table"><caption className="sr-only">Cohortes de l’institution</caption><thead><tr><th scope="col">Code</th><th scope="col" className="num">Apprenants</th><th scope="col">Préparation moyenne</th><th scope="col" className="num">Prêt·es</th><th scope="col">Examen</th></tr></thead>
          <tbody>{cohorts.map(c => <tr key={c.code}><th scope="row" style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{c.code}</th><td className="num">{c.n}</td><td style={{ minWidth: 200 }}>{c.n ? <div className="row"><Meter value={c.mean} tier={c.mean < 0.5 ? 1 : c.mean < 0.7 ? 2 : 3} thin /><span className="num small" style={{ width: 44 }}>{pct(c.mean)}</span></div> : <span className="subtle">pas encore de données</span>}</td><td className="num">{c.ready}</td><td>{c.exam}</td></tr>)}</tbody></table></div>
      </section>
      <section className="section grid-2" style={{ alignItems: 'center' }}>
        <Vignette kind="site" />
        <div className="stack-sm"><h2>La formation produit du travail réel.</h2><p className="muted">Quand « Relier à mon projet » sera ouvert, cette vue montrera aussi les livrables validés par les formateurs : charte, WBS, registre des risques, plan de communication. Un argument plus solide qu’un score.</p></div>
      </section>
      <p className="small subtle" style={{ marginTop: 'var(--s-6)' }}>Données « Exemple ». Cette vue est une proposition : le backend ne possède aujourd’hui ni écran ni point d’accès institution.</p>
    </div>
  )
}
