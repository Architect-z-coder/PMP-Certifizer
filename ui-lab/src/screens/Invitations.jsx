import React from 'react'
import { Copy, Check, X, Mail } from 'lucide-react'
import { INVITATIONS } from '../data.js'
import { Empty, Toast } from '../ui.jsx'

export default function Invitations({ state }) {
  const list = state === 'Vide' ? [] : INVITATIONS
  const STATUS = { pending: ['En attente', 'chip-warm'], accepted: ['Acceptée', 'chip-accent'], revoked: ['Révoquée', 'chip-outline'] }
  return (
    <div className="page" style={{ maxWidth: 980 }}>
      <div className="page-head"><div><div className="label">Invitations · cohorte PMP-2026-A · 14 / 20 sièges</div><h1>Un lien par personne, à usage unique.</h1></div></div>
      <div className="grid-main" data-left="" style={{ '--aside-w': '380px' }}>
        <form className="card stack-sm" onSubmit={e => e.preventDefault()} aria-labelledby="inv-h">
          <h2 id="inv-h" style={{ fontSize: 'var(--t-xl)' }}>Créer des liens</h2>
          <div className="field"><label htmlFor="inv-list">Noms ou emails, un par ligne</label><textarea id="inv-list" className="textarea" placeholder={'Nadia\nk.exemple@formation.example'} /><p className="hint">Les emails sont reconnus automatiquement et reçoivent le lien. Les doublons sont ignorés.</p></div>
          <div className="field"><label htmlFor="inv-role">Rôle</label><select id="inv-role" className="select"><option>Apprenant·es</option><option>Formateur</option></select></div>
          <button type="submit" className="btn btn-primary"><Mail size={16} aria-hidden="true" /> Créer les liens</button>
          <p className="small subtle">Le lien rattache un profil existant sans perdre sa progression. Il peut être révoqué tant qu’il n’est pas utilisé.</p>
        </form>
        <section className="card" aria-labelledby="inv-l">
          <div className="card-head"><h2 id="inv-l" style={{ fontSize: 'var(--t-xl)' }}>Invitations de la cohorte · {list.length}</h2>{list.some(i => i.status === 'pending') && <button type="button" className="btn btn-secondary btn-sm"><Copy size={14} aria-hidden="true" /> Copier tous les liens en attente</button>}</div>
          {list.length === 0 ? <Empty title="Aucune invitation pour l’instant">Créez vos premiers liens à gauche, ou partagez le code de classe PMP-2026-A.</Empty> : (
            <ul className="list">{list.map((i, k) => <li key={k}><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 500 }}>{i.who}{i.role === 'trainer' && <span className="chip chip-outline" style={{ marginLeft: 8, minHeight: 22, fontSize: 11 }}>formateur</span>}</div><div className="small subtle">{i.email}{i.link && <> · <span className="num" style={{ fontFamily: 'var(--font-mono)' }}>{i.link}</span></>}</div></div><span className={`chip ${STATUS[i.status][1]}`}>{STATUS[i.status][0]}</span>{i.status === 'pending' && <><button type="button" className="btn btn-ghost btn-sm"><Copy size={14} aria-hidden="true" /> Copier</button><button type="button" className="btn btn-ghost btn-icon" aria-label={`Révoquer l’invitation de ${i.who}`}><X size={16} aria-hidden="true" /></button></>}</li>)}</ul>
          )}
        </section>
      </div>
      {state === 'Liens copiés' && <Toast>1 lien copié</Toast>}
    </div>
  )
}
