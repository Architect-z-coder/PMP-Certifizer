import React, { useEffect, useState } from "react";
import { getPortrait, exportMyDataUrl, getDeletionStatus, requestDeletion, cancelDeletion,
         linkEmail, unlinkEmail, setTestPlan, getMe } from "./api.js";

/* ======================================================================
   v42 — Réglages : un seul endroit pour gérer son compte.

   Avant, les réglages étaient éparpillés (langue en haut, changement d'utilisateur
   ailleurs, bascule de plan flottante) — et il n'existait AUCUN moyen de lier un
   email après coup : un apprenant qui avait cliqué « Plus tard » restait bloqué
   sans lien magique et sans possibilité de recevoir ses données. Trou comblé ici.

   Quatre blocs : Mon compte · Ma langue · Mes données (portabilité + effacement)
   · Formateur (bascule de test, si applicable).
   ====================================================================== */

const C = {
  ink: "#0E1A2B", ink2: "#16263B", paper: "#EDF1F5", card: "#FFFFFF",
  text: "#16202E", muted: "#5E6E7F", line: "#DCE3EA",
  amber: "#E89A3C", teal: "#2E8C9E", green: "#3DA776", red: "#D2664E",
};

const T = {
  title: { fr: "Réglages", en: "Settings" },
  sub: { fr: "Votre compte, vos préférences, vos données.", en: "Your account, your preferences, your data." },

  account: { fr: "Mon compte", en: "My account" },
  name: { fr: "Nom", en: "Name" },
  cohort: { fr: "Cohorte", en: "Cohort" },
  none: { fr: "aucune", en: "none" },
  prog: { fr: "Progression", en: "Progress" },

  emailT: { fr: "Email de récupération", en: "Recovery email" },
  emailSub: { fr: "Facultatif. Il vous permet de retrouver votre progression sur un autre appareil, et de recevoir vos données si vous supprimez votre compte.", en: "Optional. It lets you recover your progress on another device, and receive your data if you delete your account." },
  emailNone: { fr: "Aucun email lié", en: "No email linked" },
  emailAdd: { fr: "Lier cet email", en: "Link this email" },
  emailChange: { fr: "Modifier", en: "Change" },
  emailRemove: { fr: "Retirer", en: "Remove" },
  emailSaved: { fr: "✓ Email enregistré", en: "✓ Email saved" },
  emailRemoved: { fr: "Email retiré. Vous ne pourrez plus vous reconnecter par lien magique.", en: "Email removed. Magic-link sign-in is no longer possible." },
  cancel: { fr: "Annuler", en: "Cancel" },

  langT: { fr: "Langue", en: "Language" },
  langSub: { fr: "S'applique à toute l'interface et aux contenus générés.", en: "Applies to the whole interface and generated content." },

  dataT: { fr: "Mes données", en: "My data" },
  dataSub: { fr: "Vous restez propriétaire de vos données. Deux fichiers, deux usages.", en: "You own your data. Two files, two uses." },
  dlPortrait: { fr: "⭳ Mon portrait d'apprentissage (PDF)", en: "⭳ My learning portrait (PDF)" },
  dlPortraitSub: { fr: "Le document qui montre votre carte, votre chemin critique et vos réflexes.", en: "The document showing your map, critical path and reflexes." },
  dlExcel: { fr: "⭳ Mes données brutes (Excel)", en: "⭳ My raw data (Excel)" },
  dlExcelSub: { fr: "Tout ce que Certifizer conserve sur vous, réutilisable ailleurs.", en: "Everything Certifizer holds about you, reusable elsewhere." },

  danger: { fr: "Zone sensible", en: "Sensitive zone" },
  delSub: { fr: "La suppression efface définitivement votre compte et toute votre progression.", en: "Deletion permanently erases your account and all your progress." },
  delBtn: { fr: "Supprimer mon compte", en: "Delete my account" },

  trainerT: { fr: "Formateur — outils de test", en: "Trainer — test tools" },
  trainerSub: { fr: "Basculez votre propre plan pour vérifier les fonctions premium. Visible par vous seul.", en: "Switch your own plan to check premium features. Visible to you only." },
  planNow: { fr: "Plan actuel", en: "Current plan" },
  toPremium: { fr: "⇄ Passer en premium", en: "⇄ Switch to premium" },
  toFree: { fr: "⇄ Revenir en gratuit", en: "⇄ Back to free" },

  rights: { fr: "Vos droits : accès, portabilité, effacement. Conformément au RGPD et à la loi 18-07. Contact : contact@certifizer.app", en: "Your rights: access, portability, erasure. Under GDPR and law 18-07. Contact: contact@certifizer.app" },

  // confirmation de suppression
  cTitle: { fr: "Supprimer votre compte ?", en: "Delete your account?" },
  cSub: { fr: "Prenez un instant. Cette action est sérieuse.", en: "Take a moment. This is serious." },
  cWill: { fr: "Ce qui sera définitivement effacé :", en: "What will be permanently erased:" },
  cBefore: { fr: "Avant de partir — emportez votre travail :", en: "Before you go — take your work with you:" },
  mailWill: { fr: "📧 Nous vous enverrons aussi ces deux fichiers par email, immédiatement — même si vous oubliez de les télécharger.", en: "📧 We'll also email you both files right away — even if you forget to download them." },
  mailNo: { fr: "Vous n'avez pas d'email lié : vous ne recevrez rien. Ajoutez-en un ci-dessus (Mon compte) si vous voulez recevoir vos données.", en: "No email linked: you'll receive nothing. Add one above (My account) if you want your data sent to you." },
  cType: { fr: "Pour confirmer, saisissez SUPPRIMER :", en: "To confirm, type DELETE:" },
  cWord: { fr: "SUPPRIMER", en: "DELETE" },
  cGo: { fr: "Supprimer définitivement mon compte", en: "Permanently delete my account" },

  // délai de grâce
  gLabel: { fr: "Effacement définitif dans", en: "Permanent erasure in" },
  gDays: { fr: "jours", en: "days" },
  gBody: { fr: "Votre compte est désactivé. Passé ce délai, tout sera effacé définitivement, sans retour possible.", en: "Your account is deactivated. After this delay, everything will be permanently erased." },
  gRestore: { fr: "↺ Annuler la suppression et récupérer mon compte", en: "↺ Cancel deletion and restore my account" },
  gMail: { fr: "Vos données vous ont été envoyées par email.", en: "Your data has been emailed to you." },
  gWhy1: { fr: "Une suppression accidentelle reste réversible.", en: "An accidental deletion stays reversible." },
  gWhy2: { fr: "Un clic suffit à tout récupérer, progression intacte.", en: "One click restores everything, progress intact." },
  gWhy3: { fr: "Effacement immédiat possible sur demande à contact@certifizer.app.", en: "Immediate erasure available on request at contact@certifizer.app." },
  sciT: { fr: "Ce que dit la recherche", en: "What the research says" },
  sci1: { fr: "La connaissance non entretenue se dégrade — c'est la courbe de l'oubli, documentée depuis Ebbinghaus. Ce que vous avez construit ici ne disparaîtra pas d'un coup, mais s'estompera sans réactivation.", en: "Knowledge that isn't maintained decays — that's the forgetting curve, documented since Ebbinghaus. What you built here won't vanish at once, but it will fade without reactivation." },
  sci2: { fr: "Ce qui la retient le mieux, ce n'est pas la révision — c'est l'usage. Appliquer ces concepts à vos vrais projets reste le moyen le plus solide de les garder.", en: "What holds it best isn't revision — it's use. Applying these concepts to your real projects remains the strongest way to keep them." },

  loading: { fr: "Chargement…", en: "Loading…" },
};

export default function Reglages({ learnerId, learnerName, lang, setLang, me, refreshMe, onOpenPortrait }) {
  const [p, setP] = useState(null);
  const [del, setDel] = useState(null);
  const [step, setStep] = useState("home");
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);

  const [editMail, setEditMail] = useState(false);
  const [mail, setMail] = useState("");
  const [mailMsg, setMailMsg] = useState(null);
  const [mailErr, setMailErr] = useState(null);

  const t = (k) => (T[k] && (T[k][lang] || T[k].fr)) || "";

  async function reload() {
    const [pp, dd] = await Promise.all([getPortrait(learnerId, lang), getDeletionStatus(learnerId)]);
    setP(pp); setDel(dd);
  }
  useEffect(() => { reload().catch(() => { }); /* eslint-disable-next-line */ }, [learnerId, lang]);

  async function saveMail() {
    const e = mail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setMailErr(lang === "en" ? "Enter a valid email." : "Saisissez un email valide."); return;
    }
    setBusy(true); setMailErr(null);
    try {
      const r = await linkEmail(learnerId, e);
      if (r && r.ok) {
        setMailMsg(t("emailSaved")); setEditMail(false); setMail("");
        await reload();
        setTimeout(() => setMailMsg(null), 2600);
      } else {
        setMailErr(lang === "en" ? (r.message_en || "Could not link this email.") : (r.message_fr || "Impossible de lier cet email."));
      }
    } catch (e2) { setMailErr(lang === "en" ? "Connection failed." : "Connexion impossible."); }
    setBusy(false);
  }

  async function removeMail() {
    setBusy(true);
    try {
      await unlinkEmail(learnerId);
      setMailMsg(t("emailRemoved"));
      await reload();
      setTimeout(() => setMailMsg(null), 4000);
    } catch (e) { /* */ }
    setBusy(false);
  }

  async function togglePlan() {
    if (!me || !me.is_trainer) return;
    setBusy(true);
    try {
      await setTestPlan(learnerId, me.effective_plan === "premium" ? "free" : "premium");
      if (refreshMe) await refreshMe();
    } catch (e) { /* */ }
    setBusy(false);
  }

  async function doDelete() {
    if (word.trim().toUpperCase() !== t("cWord") || busy) return;
    setBusy(true);
    try {
      await requestDeletion(learnerId);
      await reload();
      setStep("home"); setWord("");
    } catch (e) { /* */ }
    setBusy(false);
  }

  async function doCancel() {
    setBusy(true);
    try { await cancelDeletion(learnerId); await reload(); } catch (e) { /* */ }
    setBusy(false);
  }

  if (!p || !del) return <div style={{ flex: 1, padding: 40, textAlign: "center", color: C.muted, fontSize: 13.5 }}>{t("loading")}</div>;

  const wrap = { flex: 1, minHeight: 0, overflowY: "auto", background: C.paper, padding: "20px 18px 44px" };
  const inner = { maxWidth: 640, margin: "0 auto" };
  const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 11, padding: "14px 16px", marginBottom: 12 };
  const S = { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 1.1, textTransform: "uppercase", color: C.muted, marginBottom: 8 };
  const btnDark = { width: "100%", background: C.ink, color: "#fff", border: "none", borderRadius: 9, padding: "11px", fontWeight: 700, fontSize: 13.5, fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer" };
  const btnTeal = { display: "block", textAlign: "center", background: C.teal, color: "#fff", borderRadius: 9, padding: "11px", fontWeight: 700, fontSize: 13.5, textDecoration: "none", fontFamily: "'Space Grotesk', sans-serif" };

  /* ============ DÉLAI DE GRÂCE ============ */
  if (del.pending) {
    return (
      <div className="ak-scroll" style={wrap}>
        <div style={inner}>
          <div style={{ background: `linear-gradient(135deg, ${C.ink2}, ${C.ink})`, borderRadius: 13, padding: "22px 20px", color: "#EAF0F6", textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 1.3, textTransform: "uppercase", color: "#9DB0C2" }}>{t("gLabel")}</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 40, color: C.amber, margin: "8px 0" }}>
              {del.days_left} <span style={{ fontSize: 19 }}>{t("gDays")}</span>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: "#B8C7D6", maxWidth: 420, margin: "0 auto 8px" }}>{t("gBody")}</div>
            {p.email && <div style={{ fontSize: 12, color: C.green, marginBottom: 14 }}>📧 {t("gMail")}</div>}
            <button onClick={doCancel} disabled={busy}
              style={{ background: C.green, color: "#fff", border: "none", borderRadius: 10, padding: "12px 20px", fontWeight: 700, fontSize: 13.5, fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer" }}>
              {t("gRestore")}
            </button>
          </div>
          <div style={card}>
            <div style={{ fontSize: 12.8, lineHeight: 1.75, color: C.text }}>
              <div>• {t("gWhy1")}</div>
              <div>• {t("gWhy2")}</div>
              <div>• {t("gWhy3")}</div>
            </div>
          </div>

          {/* Un fait, pas un argument de rétention. La connaissance se dégrade —
              c'est vrai, c'est utile à savoir, et ça ne cherche pas à retenir
              qui que ce soit par la peur. Aucun taux chiffré : notre logique de
              décroissance est un outil de priorisation, pas un modèle prédictif
              de la mémoire humaine. Une fausse précision serait une manipulation. */}
          <div style={{ background: "#EAF1F3", borderLeft: `3px solid ${C.teal}`, borderRadius: 8, padding: "14px 15px" }}>
            <div style={{ ...S, color: C.teal, marginBottom: 7 }}>{t("sciT")}</div>
            <div style={{ fontSize: 12.8, lineHeight: 1.7, color: C.text, marginBottom: 8 }}>{t("sci1")}</div>
            <div style={{ fontSize: 12.8, lineHeight: 1.7, color: C.text }}>{t("sci2")}</div>
          </div>
        </div>
      </div>
    );
  }

  /* ============ CONFIRMATION DE SUPPRESSION ============ */
  if (step === "confirm") {
    const ok = word.trim().toUpperCase() === t("cWord");
    return (
      <div className="ak-scroll" style={wrap}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 19, color: C.red, marginBottom: 4 }}>{t("cTitle")}</div>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 14 }}>{t("cSub")}</div>

          <div style={{ background: "#FBF1ED", border: `1px solid ${C.red}`, borderRadius: 10, padding: "13px 15px", marginBottom: 12, fontSize: 12.8, lineHeight: 1.65 }}>
            <b style={{ color: C.red }}>{t("cWill")}</b>
            <ul style={{ margin: "7px 0 0 17px" }}>
              <li>{learnerName || learnerId}{p.email ? ` · ${p.email}` : ""}</li>
              <li>{p.total_answers} {lang === "en" ? "answers" : "réponses"} · {p.acquired}/{p.total_areas} {lang === "en" ? "areas" : "domaines"}</li>
              <li>{(p.reflexes || []).length} {lang === "en" ? "reflexes" : "réflexes"}</li>
              <li>{lang === "en" ? "Cohort membership and assigned sessions" : "Appartenance à la cohorte et séances assignées"}</li>
            </ul>
          </div>

          <div style={{ background: "#EAF1F3", border: `1px solid ${C.teal}`, borderRadius: 10, padding: "13px 15px", marginBottom: 12 }}>
            <div style={{ fontSize: 12.8, lineHeight: 1.6, marginBottom: 10, fontWeight: 600 }}>{t("cBefore")}</div>
            <div style={{ display: "grid", gap: 8 }}>
              <button onClick={() => onOpenPortrait && onOpenPortrait()} style={btnDark}>{t("dlPortrait")}</button>
              <a href={exportMyDataUrl(learnerId, lang)} download style={btnTeal}>{t("dlExcel")}</a>
            </div>
          </div>

          <div style={{
            background: p.email ? "#E4F3EC" : "#FFF7EC",
            border: `1px solid ${p.email ? C.green : C.amber}`,
            borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 12.5, lineHeight: 1.6,
          }}>
            {p.email ? t("mailWill") : t("mailNo")}
          </div>

          <label style={{ fontSize: 12.5, color: C.muted, display: "block", marginBottom: 5 }}>{t("cType")}</label>
          <input value={word} onChange={(e) => setWord(e.target.value)} placeholder={t("cWord")} autoFocus
            style={{ width: "100%", border: `1px solid ${ok ? C.red : C.line}`, borderRadius: 9, padding: "10px 12px", fontSize: 13.5, fontFamily: "'IBM Plex Mono', monospace", outline: "none", marginBottom: 10 }} />
          <button onClick={doDelete} disabled={!ok || busy}
            style={{ width: "100%", padding: 12, border: "none", borderRadius: 10, background: ok && !busy ? C.red : "#C3CDD7", color: ok && !busy ? "#fff" : "#7E8B99", fontWeight: 700, fontSize: 13.5, fontFamily: "'Space Grotesk', sans-serif", cursor: ok && !busy ? "pointer" : "not-allowed" }}>
            {t("cGo")}
          </button>
          <button onClick={() => { setStep("home"); setWord(""); }}
            style={{ width: "100%", marginTop: 8, padding: 11, borderRadius: 10, border: `1px solid ${C.line}`, background: "transparent", color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            {t("cancel")}
          </button>
        </div>
      </div>
    );
  }

  /* ============ RÉGLAGES ============ */
  return (
    <div className="ak-scroll" style={wrap}>
      <div style={inner}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 3 }}>{t("title")}</div>
        <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>{t("sub")}</div>

        {/* ---- Mon compte ---- */}
        <div style={card}>
          <div style={S}>{t("account")}</div>
          {[[t("name"), learnerName || learnerId],
            [t("cohort"), p.cohort || t("none")],
            [t("prog"), `${p.acquired}/${p.total_areas} · ${p.total_answers} ${lang === "en" ? "answers" : "réponses"}`]
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: `1px solid ${C.line}`, fontSize: 13 }}>
              <span style={{ color: C.muted, flex: 1 }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}

          {/* email — le trou comblé */}
          <div style={{ paddingTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{t("emailT")}</div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55, marginBottom: 9 }}>{t("emailSub")}</div>

            {!editMail ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ flex: 1, minWidth: 160, fontSize: 13.5, fontWeight: 600, color: p.email ? C.text : C.muted, fontStyle: p.email ? "normal" : "italic" }}>
                  {p.email || t("emailNone")}
                </span>
                <button onClick={() => { setEditMail(true); setMail(p.email || ""); setMailErr(null); }}
                  style={{ background: p.email ? "transparent" : C.amber, color: p.email ? C.teal : C.ink, border: p.email ? `1px solid ${C.line}` : "none", borderRadius: 8, padding: "7px 13px", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
                  {p.email ? t("emailChange") : t("emailAdd")}
                </button>
                {p.email && (
                  <button onClick={removeMail} disabled={busy}
                    style={{ background: "transparent", color: C.red, border: `1px solid ${C.line}`, borderRadius: 8, padding: "7px 13px", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
                    {t("emailRemove")}
                  </button>
                )}
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 7 }}>
                  <input value={mail} onChange={(e) => { setMail(e.target.value); setMailErr(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") saveMail(); }}
                    placeholder="vous@exemple.com" type="email" autoFocus
                    style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 11px", fontSize: 13, outline: "none" }} />
                  <button onClick={saveMail} disabled={busy}
                    style={{ background: C.amber, color: C.ink, border: "none", borderRadius: 8, padding: "9px 14px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap" }}>
                    {t("emailAdd")}
                  </button>
                </div>
                <button onClick={() => { setEditMail(false); setMailErr(null); }}
                  style={{ marginTop: 7, background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", padding: 0 }}>
                  {t("cancel")}
                </button>
              </>
            )}
            {mailErr && <div style={{ color: C.red, fontSize: 12.5, marginTop: 8 }}>{mailErr}</div>}
            {mailMsg && <div style={{ color: C.green, fontSize: 12.5, marginTop: 8, lineHeight: 1.5 }}>{mailMsg}</div>}
          </div>
        </div>

        {/* ---- Langue ---- */}
        <div style={card}>
          <div style={S}>{t("langT")}</div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55, marginBottom: 10 }}>{t("langSub")}</div>
          <div style={{ display: "flex", gap: 7 }}>
            {[["fr", "Français"], ["en", "English"]].map(([code, lbl]) => (
              <button key={code} onClick={() => setLang && setLang(code)}
                style={{ flex: 1, padding: "10px", borderRadius: 9, border: `1px solid ${lang === code ? C.amber : C.line}`, background: lang === code ? "#FFF7EC" : "#fff", color: lang === code ? C.ink : C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* ---- Formateur ---- */}
        {me && me.is_trainer && (
          <div style={{ ...card, borderColor: C.teal, background: "#F5FBFC" }}>
            <div style={{ ...S, color: C.teal }}>{t("trainerT")}</div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55, marginBottom: 10 }}>{t("trainerSub")}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ flex: 1, minWidth: 120, fontSize: 13 }}>
                <span style={{ color: C.muted }}>{t("planNow")} : </span>
                <b style={{ color: me.effective_plan === "premium" ? C.amber : C.text, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {me.effective_plan}
                </b>
              </span>
              <button onClick={togglePlan} disabled={busy}
                style={{ background: C.ink, color: "#fff", border: "none", borderRadius: 8, padding: "9px 15px", fontWeight: 600, fontSize: 12.5, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" }}>
                {me.effective_plan === "premium" ? t("toFree") : t("toPremium")}
              </button>
            </div>
          </div>
        )}

        {/* ---- Mes données ---- */}
        <div style={card}>
          <div style={S}>{t("dataT")}</div>
          <div style={{ fontSize: 12.8, lineHeight: 1.55, color: C.muted, marginBottom: 11 }}>{t("dataSub")}</div>

          <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{t("dlPortraitSub")}</div>
          <button onClick={() => onOpenPortrait && onOpenPortrait()} style={{ ...btnDark, marginBottom: 12 }}>{t("dlPortrait")}</button>

          <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{t("dlExcelSub")}</div>
          <a href={exportMyDataUrl(learnerId, lang)} download style={btnTeal}>{t("dlExcel")}</a>
        </div>

        {/* ---- Zone sensible ---- */}
        <div style={{ ...card, borderColor: "#F0D5CD" }}>
          <div style={{ ...S, color: C.red }}>{t("danger")}</div>
          <div style={{ fontSize: 12.8, lineHeight: 1.55, color: C.muted, marginBottom: 10 }}>{t("delSub")}</div>
          <button onClick={() => setStep("confirm")}
            style={{ width: "100%", background: "#fff", color: C.red, border: `1px solid ${C.red}`, borderRadius: 9, padding: "11px", fontWeight: 700, fontSize: 13.5, fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer" }}>
            {t("delBtn")}
          </button>
        </div>

        <div style={{ background: "#EAF1F3", borderLeft: `3px solid ${C.teal}`, borderRadius: 8, padding: "11px 13px", fontSize: 11.8, lineHeight: 1.6, color: C.text }}>
          {t("rights")}
        </div>
      </div>
    </div>
  );
}
