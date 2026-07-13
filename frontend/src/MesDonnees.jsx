import React, { useEffect, useState } from "react";
import { getPortrait, exportMyDataUrl, getDeletionStatus, requestDeletion, cancelDeletion } from "./api.js";

/* ======================================================================
   v41 — « Mes données » : portabilité + droit à l'effacement.

   Trois écrans, dans l'ordre du parcours :
     1. ce que Certifizer conserve + télécharger (Excel) + voir mon portrait
     2. confirmation forte (liste explicite + saisie du mot SUPPRIMER)
     3. délai de grâce : le compte est désactivé, PAS encore effacé — et
        l'apprenant peut tout récupérer d'un clic.

   Le délai de grâce n'entrave pas le droit à l'effacement : il le sécurise
   contre l'erreur. L'effacement immédiat reste possible sur demande.
   ====================================================================== */

const C = {
  ink: "#0E1A2B", ink2: "#16263B", paper: "#EDF1F5", card: "#FFFFFF",
  text: "#16202E", muted: "#5E6E7F", line: "#DCE3EA",
  amber: "#E89A3C", teal: "#2E8C9E", green: "#3DA776", red: "#D2664E",
};

const T = {
  title: { fr: "Mes données", en: "My data" },
  sub: { fr: "Vous restez propriétaire de vos données. Vous pouvez les télécharger ou supprimer votre compte à tout moment.", en: "You own your data. You can download it or delete your account at any time." },
  holds: { fr: "Ce que Certifizer conserve", en: "What Certifizer holds" },
  name: { fr: "Nom", en: "Name" },
  email: { fr: "Email de récupération", en: "Recovery email" },
  noEmail: { fr: "aucun (facultatif)", en: "none (optional)" },
  prog: { fr: "Progression", en: "Progress" },
  areas: { fr: "domaines", en: "areas" },
  answers: { fr: "réponses", en: "answers" },
  refl: { fr: "Réflexes sauvegardés", en: "Reflexes saved" },
  dl: { fr: "Télécharger mes données", en: "Download my data" },
  dlSub: { fr: "Un fichier Excel avec votre progression complète, votre chemin critique, vos réflexes et votre trajectoire. Utilisable ailleurs.", en: "An Excel file with your full progress, critical path, reflexes and trajectory. Usable elsewhere." },
  dlBtn: { fr: "⭳ Télécharger (Excel)", en: "⭳ Download (Excel)" },
  danger: { fr: "Zone sensible", en: "Sensitive zone" },
  delSub: { fr: "La suppression efface définitivement votre compte et toute votre progression.", en: "Deletion permanently erases your account and all your progress." },
  delBtn: { fr: "Supprimer mon compte", en: "Delete my account" },
  rights: { fr: "Vos droits : accès, portabilité (téléchargement), effacement. Conformément au RGPD et à la loi 18-07.", en: "Your rights: access, portability (download), erasure. Under GDPR and law 18-07." },
  // confirmation
  cTitle: { fr: "Supprimer votre compte ?", en: "Delete your account?" },
  cSub: { fr: "Prenez un instant. Cette action est sérieuse.", en: "Take a moment. This is serious." },
  cWill: { fr: "Ce qui sera définitivement effacé :", en: "What will be permanently erased:" },
  cBefore: { fr: "Avant de partir — voulez-vous télécharger vos données ? Vous ne pourrez plus le faire ensuite.", en: "Before you go — download your data? You won't be able to afterwards." },
  cType: { fr: "Pour confirmer, saisissez SUPPRIMER :", en: "To confirm, type DELETE:" },
  cWord: { fr: "SUPPRIMER", en: "DELETE" },
  cGo: { fr: "Supprimer définitivement mon compte", en: "Permanently delete my account" },
  cCancel: { fr: "Annuler", en: "Cancel" },
  // grâce
  gLabel: { fr: "Effacement définitif dans", en: "Permanent erasure in" },
  gDays: { fr: "jours", en: "days" },
  gBody: { fr: "Votre compte est désactivé. Passé ce délai, tout sera effacé définitivement, sans retour possible.", en: "Your account is deactivated. After this delay, everything will be permanently erased." },
  gRestore: { fr: "↺ Annuler la suppression et récupérer mon compte", en: "↺ Cancel deletion and restore my account" },
  gWhy: { fr: "Pourquoi un délai ?", en: "Why a delay?" },
  gWhy1: { fr: "Protection contre l'erreur : une suppression accidentelle reste réversible.", en: "Protection from mistakes: an accidental deletion stays reversible." },
  gWhy2: { fr: "Changement d'avis : un clic suffit à tout récupérer, progression intacte.", en: "Change of mind: one click restores everything, progress intact." },
  gWhy3: { fr: "Effacement immédiat possible sur demande à contact@certifizer.app.", en: "Immediate erasure available on request at contact@certifizer.app." },
  loading: { fr: "Chargement…", en: "Loading…" },
};

export default function MesDonnees({ learnerId, learnerName, lang = "fr", onDeleted }) {
  const [p, setP] = useState(null);
  const [del, setDel] = useState(null);        // statut de suppression
  const [step, setStep] = useState("home");    // home | confirm
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  const t = (k) => T[k][lang] || T[k].fr;

  useEffect(() => {
    let alive = true;
    Promise.all([getPortrait(learnerId, lang), getDeletionStatus(learnerId)])
      .then(([pp, dd]) => { if (alive) { setP(pp); setDel(dd); } })
      .catch(() => { });
    return () => { alive = false; };
  }, [learnerId, lang]);

  async function doDelete() {
    if (word.trim().toUpperCase() !== t("cWord") || busy) return;
    setBusy(true);
    try {
      await requestDeletion(learnerId);
      const d = await getDeletionStatus(learnerId);
      setDel(d); setStep("home"); setWord("");
    } catch (e) { /* */ }
    setBusy(false);
  }

  async function doCancel() {
    setBusy(true);
    try {
      await cancelDeletion(learnerId);
      setDel(await getDeletionStatus(learnerId));
    } catch (e) { /* */ }
    setBusy(false);
  }

  if (!p || !del) return <div style={{ flex: 1, padding: 40, textAlign: "center", color: C.muted, fontSize: 13.5 }}>{t("loading")}</div>;

  const S = { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 1.1, textTransform: "uppercase", color: C.muted, marginBottom: 8 };
  const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 11, padding: "14px 16px", marginBottom: 12 };

  /* ---------------- DÉLAI DE GRÂCE ---------------- */
  if (del.pending) {
    return (
      <div className="ak-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", background: C.paper, padding: "20px 18px 40px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ background: `linear-gradient(135deg, ${C.ink2}, ${C.ink})`, borderRadius: 13, padding: "22px 20px", color: "#EAF0F6", textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 1.3, textTransform: "uppercase", color: "#9DB0C2" }}>{t("gLabel")}</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 40, color: C.amber, margin: "8px 0" }}>
              {del.days_left} <span style={{ fontSize: 19 }}>{t("gDays")}</span>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: "#B8C7D6", maxWidth: 420, margin: "0 auto 16px" }}>{t("gBody")}</div>
            <button onClick={doCancel} disabled={busy}
              style={{ background: C.green, color: "#fff", border: "none", borderRadius: 10, padding: "12px 20px", fontWeight: 700, fontSize: 13.5, fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer" }}>
              {t("gRestore")}
            </button>
          </div>
          <div style={card}>
            <div style={S}>{t("gWhy")}</div>
            <div style={{ fontSize: 12.8, lineHeight: 1.7, color: C.text }}>
              <div style={{ marginBottom: 6 }}>• {t("gWhy1")}</div>
              <div style={{ marginBottom: 6 }}>• {t("gWhy2")}</div>
              <div>• {t("gWhy3")}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- CONFIRMATION ---------------- */
  if (step === "confirm") {
    const ok = word.trim().toUpperCase() === t("cWord");
    return (
      <div className="ak-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", background: C.paper, padding: "20px 18px 40px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 19, color: C.red, marginBottom: 4 }}>{t("cTitle")}</div>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 14 }}>{t("cSub")}</div>

          <div style={{ background: "#FBF1ED", border: `1px solid ${C.red}`, borderRadius: 10, padding: "13px 15px", marginBottom: 12, fontSize: 12.8, lineHeight: 1.65 }}>
            <b style={{ color: C.red }}>{t("cWill")}</b>
            <ul style={{ margin: "7px 0 0 17px" }}>
              <li>{t("name")}{p.reflexes ? "" : ""} — {learnerName || learnerId}</li>
              <li>{t("prog")} — {p.total_answers} {t("answers")}, {p.acquired}/{p.total_areas} {t("areas")}</li>
              <li>{t("refl")} — {(p.reflexes || []).length}</li>
              <li>{lang === "en" ? "Your cohort membership and assigned sessions" : "Votre appartenance à la cohorte et vos séances assignées"}</li>
            </ul>
          </div>

          <div style={{ background: "#EAF1F3", border: `1px solid ${C.teal}`, borderRadius: 10, padding: "13px 15px", marginBottom: 14 }}>
            <div style={{ fontSize: 12.8, lineHeight: 1.6, marginBottom: 9 }}>💡 {t("cBefore")}</div>
            <a href={exportMyDataUrl(learnerId, lang)} download
              style={{ display: "block", textAlign: "center", background: C.teal, color: "#fff", borderRadius: 9, padding: "10px", fontWeight: 700, fontSize: 13, textDecoration: "none", fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("dlBtn")}
            </a>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12.5, color: C.muted, display: "block", marginBottom: 5 }}>{t("cType")}</label>
            <input value={word} onChange={(e) => setWord(e.target.value)} placeholder={t("cWord")} autoFocus
              style={{ width: "100%", border: `1px solid ${ok ? C.red : C.line}`, borderRadius: 9, padding: "10px 12px", fontSize: 13.5, fontFamily: "'IBM Plex Mono', monospace", outline: "none" }} />
          </div>
          <button onClick={doDelete} disabled={!ok || busy}
            style={{ width: "100%", padding: 12, border: "none", borderRadius: 10, background: ok && !busy ? C.red : "#C3CDD7", color: ok && !busy ? "#fff" : "#7E8B99", fontWeight: 700, fontSize: 13.5, fontFamily: "'Space Grotesk', sans-serif", cursor: ok && !busy ? "pointer" : "not-allowed" }}>
            {t("cGo")}
          </button>
          <button onClick={() => { setStep("home"); setWord(""); }}
            style={{ width: "100%", marginTop: 8, padding: 11, borderRadius: 10, border: `1px solid ${C.line}`, background: "transparent", color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            {t("cCancel")}
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- ACCUEIL — MES DONNÉES ---------------- */
  return (
    <div className="ak-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", background: C.paper, padding: "20px 18px 40px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 19, marginBottom: 4 }}>{t("title")}</div>
        <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.55, marginBottom: 16 }}>{t("sub")}</div>

        <div style={card}>
          <div style={S}>{t("holds")}</div>
          {[
            [t("name"), learnerName || learnerId],
            [t("email"), p.email || t("noEmail")],
            [t("prog"), `${p.acquired}/${p.total_areas} ${t("areas")} · ${p.total_answers} ${t("answers")}`],
            [t("refl"), String((p.reflexes || []).length)],
          ].map(([k, v], i, arr) => (
            <div key={k} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.line}` : "none", fontSize: 13 }}>
              <span style={{ color: C.muted, flex: 1 }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={card}>
          <div style={S}>{t("dl")}</div>
          <div style={{ fontSize: 12.8, lineHeight: 1.55, color: C.muted, marginBottom: 10 }}>{t("dlSub")}</div>
          <a href={exportMyDataUrl(learnerId, lang)} download
            style={{ display: "block", textAlign: "center", background: C.teal, color: "#fff", borderRadius: 9, padding: "11px", fontWeight: 700, fontSize: 13.5, textDecoration: "none", fontFamily: "'Space Grotesk', sans-serif" }}>
            {t("dlBtn")}
          </a>
        </div>

        <div style={{ ...card, borderColor: "#F0D5CD" }}>
          <div style={{ ...S, color: C.red }}>{t("danger")}</div>
          <div style={{ fontSize: 12.8, lineHeight: 1.55, color: C.muted, marginBottom: 10 }}>{t("delSub")}</div>
          <button onClick={() => setStep("confirm")}
            style={{ width: "100%", background: "#fff", color: C.red, border: `1px solid ${C.red}`, borderRadius: 9, padding: "11px", fontWeight: 700, fontSize: 13.5, fontFamily: "'Space Grotesk', sans-serif", cursor: "pointer" }}>
            {t("delBtn")}
          </button>
        </div>

        <div style={{ background: "#EAF1F3", borderLeft: `3px solid ${C.teal}`, borderRadius: 8, padding: "11px 13px", fontSize: 11.8, lineHeight: 1.6, color: C.text }}>
          <b style={{ color: C.teal }}>{lang === "en" ? "Your rights:" : "Vos droits :"}</b> {t("rights")}
        </div>
      </div>
    </div>
  );
}
