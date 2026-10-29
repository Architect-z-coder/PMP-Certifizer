// Calm placeholder for the screens that are not in this slice. Nothing is invented: a title, a sentence, a way back.
import React from "react";

export default function Placeholder({ lang, title, go, note }) {
  const T = (a, b) => (lang === "en" ? b : a);
  return (
    <div className="main">
      <div className="hd"><h3>{title}</h3><span className="soon">{T("bientôt", "soon")}</span></div>
      <div className="card" style={{ maxWidth: 560 }}>
        <span className="k">{T("Dans cette version", "In this version")}</span>
        <p>{note || T("Cet écran n'est pas encore disponible dans l'interface Chantier. Il arrive dans une prochaine version ; rien de ce que vous avez fait n'est perdu.", "This screen is not available yet in the Chantier interface. It comes in a later version; nothing you did is lost.")}</p>
        <div className="row"><button type="button" className="btn btn-p btn-s" onClick={() => go("today")}>{T("Retour à Aujourd'hui", "Back to Today")} →</button></div>
      </div>
    </div>
  );
}
