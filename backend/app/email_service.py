"""v38 — Envoi d'email transactionnel via Brevo (API HTTP, pas de SDK).

Dégradation propre : si BREVO_API_KEY est absente, send_email() ne lève pas —
elle renvoie {"ok": False, "reason": "not_configured"} et l'appelant continue.
Le produit reste utilisable sans email (invitations copiées à la main, etc.).
"""
import httpx

from .config import settings

TIMEOUT = httpx.Timeout(20.0)
BREVO_URL = "https://api.brevo.com/v3/smtp/email"


def is_configured() -> bool:
    return bool(settings.brevo_api_key and settings.brevo_sender_email)


async def send_email(to_email: str, subject: str, html: str,
                     to_name: str = "", attachments: list | None = None) -> dict:
    """Envoie un email transactionnel. Ne lève jamais : renvoie un dict de statut.

    attachments : [{"name": "fichier.xlsx", "content": <bytes>}] — encodées en
    base64 pour Brevo. Utilisé pour rendre ses données à l'apprenant qui part.
    """
    if not is_configured():
        return {"ok": False, "reason": "not_configured"}
    if not to_email:
        return {"ok": False, "reason": "no_recipient"}
    payload = {
        "sender": {"email": settings.brevo_sender_email,
                   "name": settings.brevo_sender_name or "Certifizer"},
        "to": [{"email": to_email, "name": to_name or to_email}],
        "subject": subject,
        "htmlContent": html,
    }
    if attachments:
        import base64
        payload["attachment"] = [
            {"name": a["name"],
             "content": base64.b64encode(a["content"]).decode()}
            for a in attachments if a.get("content")
        ]
    headers = {"api-key": settings.brevo_api_key,
               "Content-Type": "application/json", "accept": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.post(BREVO_URL, json=payload, headers=headers)
        if r.status_code in (200, 201, 202):
            return {"ok": True}
        return {"ok": False, "reason": "brevo_error",
                "status": r.status_code, "detail": r.text[:300]}
    except Exception as e:
        return {"ok": False, "reason": "network", "detail": str(e)[:200]}


# ---- Gabarits d'email (bilingues, sobres, sans dépendance externe) ----
def _shell(title: str, body_html: str, lang: str = "fr") -> str:
    foot = ("Vous recevez cet email car il a été demandé sur Certifizer. "
            "Si ce n'était pas vous, ignorez-le simplement."
            if lang != "en" else
            "You received this email because it was requested on Certifizer. "
            "If this wasn't you, simply ignore it.")
    return f"""<!DOCTYPE html><html><body style="margin:0;background:#EDF1F5;font-family:Arial,Helvetica,sans-serif;color:#16202E">
<div style="max-width:480px;margin:0 auto;padding:24px">
  <div style="background:#0E1A2B;border-radius:12px 12px 0 0;padding:18px 22px;color:#fff;font-weight:bold;font-size:18px">Certifizer</div>
  <div style="background:#fff;border:1px solid #DCE3EA;border-top:none;border-radius:0 0 12px 12px;padding:24px 22px">
    <h1 style="font-size:19px;margin:0 0 12px">{title}</h1>
    {body_html}
  </div>
  <p style="color:#5E6E7F;font-size:11px;line-height:1.6;margin:14px 4px 0">{foot}</p>
</div></body></html>"""


def _button(url: str, label: str) -> str:
    return (f'<a href="{url}" style="display:inline-block;background:#E89A3C;color:#0E1A2B;'
            f'font-weight:bold;font-size:15px;text-decoration:none;padding:12px 22px;'
            f'border-radius:9px;margin:8px 0">{label}</a>')


def magic_link_email(link: str, lang: str = "fr") -> tuple:
    if lang == "en":
        subj = "Your Certifizer sign-in link"
        body = ("<p style='font-size:14px;line-height:1.6;color:#16202E'>Hello, click below to sign back in. "
                "This link is valid for 30 minutes and can be used once.</p>"
                f"{_button(link, 'Sign me in →')}"
                "<p style='font-size:12px;color:#5E6E7F;margin-top:14px'>If the button doesn't work, copy this link:<br>"
                f"<span style='color:#2E8C9E;word-break:break-all'>{link}</span></p>")
        return subj, _shell("Sign back in", body, lang)
    subj = "Votre lien de connexion Certifizer"
    body = ("<p style='font-size:14px;line-height:1.6;color:#16202E'>Bonjour, cliquez ci-dessous pour vous reconnecter. "
            "Ce lien est valable 30 minutes et à usage unique.</p>"
            f"{_button(link, 'Me connecter →')}"
            "<p style='font-size:12px;color:#5E6E7F;margin-top:14px'>Si le bouton ne fonctionne pas, copiez ce lien :<br>"
            f"<span style='color:#2E8C9E;word-break:break-all'>{link}</span></p>")
    return subj, _shell("Retrouver ma progression", body, lang)


def invitation_email(link: str, cohort_code: str, lang: str = "fr") -> tuple:
    if lang == "en":
        subj = f"You're invited to join cohort {cohort_code} on Certifizer"
        body = (f"<p style='font-size:14px;line-height:1.6;color:#16202E'>Your trainer invites you to join cohort "
                f"<b>{cohort_code}</b> and start your PMP preparation. Your progress is personal and starts right away.</p>"
                f"{_button(link, 'Join the cohort →')}"
                "<p style='font-size:12px;color:#5E6E7F;margin-top:14px'>If the button doesn't work, copy this link:<br>"
                f"<span style='color:#2E8C9E;word-break:break-all'>{link}</span></p>")
        return subj, _shell("Join your cohort", body, lang)
    subj = f"Invitation à rejoindre la cohorte {cohort_code} sur Certifizer"
    body = (f"<p style='font-size:14px;line-height:1.6;color:#16202E'>Votre formateur vous invite à rejoindre la cohorte "
            f"<b>{cohort_code}</b> et à démarrer votre préparation PMP. Votre progression est personnelle et commence immédiatement.</p>"
            f"{_button(link, 'Rejoindre la cohorte →')}"
            "<p style='font-size:12px;color:#5E6E7F;margin-top:14px'>Si le bouton ne fonctionne pas, copiez ce lien :<br>"
            f"<span style='color:#2E8C9E;word-break:break-all'>{link}</span></p>")
    return subj, _shell("Rejoindre votre cohorte", body, lang)


def deletion_email(days: int, lang: str = "fr") -> tuple:
    """Email envoyé quand l'apprenant demande la suppression de son compte.
    Ses données sont JOINTES — il n'a rien demandé, mais il les retrouvera
    peut-être un jour avec soulagement."""
    if lang == "en":
        subj = "Your Certifizer data — before your account is erased"
        body = (f"<p style='font-size:14px;line-height:1.6;color:#16202E'>You asked to delete your Certifizer "
                f"account. Before it goes, here is everything you built — attached to this email:</p>"
                "<ul style='font-size:13.5px;line-height:1.8;color:#16202E'>"
                "<li><b>Your learning portrait</b> (HTML — open it and press Ctrl+P to save as PDF)</li>"
                "<li><b>Your raw data</b> (Excel — progress, critical path, reflexes, trajectory)</li></ul>"
                f"<p style='font-size:14px;line-height:1.6;color:#16202E'>Your account stays recoverable for "
                f"<b>{days} days</b>. If you change your mind, sign back in and cancel the deletion — nothing is lost. "
                f"After that, everything is erased for good.</p>"
                "<div style='margin-top:18px;padding:14px 15px;background:#EAF1F3;border-left:3px solid #2E8C9E;"
                "border-radius:6px'>"
                "<div style='font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:#2E8C9E;"
                "font-weight:bold;margin-bottom:7px'>What the research says</div>"
                "<p style='font-size:13px;line-height:1.65;color:#16202E;margin:0 0 8px'>Knowledge that isn't "
                "maintained decays — that's the <b>forgetting curve</b>, documented since Ebbinghaus. What you "
                "built here won't vanish at once, but it will fade without reactivation.</p>"
                "<p style='font-size:13px;line-height:1.65;color:#16202E;margin:0'>What holds it best isn't "
                "revision — <b>it's use</b>. Applying these concepts to your real projects remains the strongest "
                "way to keep them.</p></div>"
                "<p style='font-size:12px;color:#5E6E7F;margin-top:14px'>We're sending this without you asking, "
                "because people sometimes regret losing their work. It's yours.</p>")
        return subj, _shell("Your data, before you go", body, lang)

    subj = "Vos données Certifizer — avant l'effacement de votre compte"
    body = ("<p style='font-size:14px;line-height:1.6;color:#16202E'>Vous avez demandé la suppression de votre "
            "compte Certifizer. Avant qu'il ne disparaisse, voici tout ce que vous avez construit — "
            "joint à cet email :</p>"
            "<ul style='font-size:13.5px;line-height:1.8;color:#16202E'>"
            "<li><b>Votre portrait d'apprentissage</b> (HTML — ouvrez-le et faites Ctrl+P pour l'enregistrer en PDF)</li>"
            "<li><b>Vos données brutes</b> (Excel — progression, chemin critique, réflexes, trajectoire)</li></ul>"
            f"<p style='font-size:14px;line-height:1.6;color:#16202E'>Votre compte reste récupérable pendant "
            f"<b>{days} jours</b>. Si vous changez d'avis, reconnectez-vous et annulez la suppression — rien n'est "
            f"perdu. Passé ce délai, tout sera effacé définitivement.</p>"
            "<div style='margin-top:18px;padding:14px 15px;background:#EAF1F3;border-left:3px solid #2E8C9E;"
            "border-radius:6px'>"
            "<div style='font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:#2E8C9E;"
            "font-weight:bold;margin-bottom:7px'>Ce que dit la recherche</div>"
            "<p style='font-size:13px;line-height:1.65;color:#16202E;margin:0 0 8px'>La connaissance non "
            "entretenue se dégrade — c'est la <b>courbe de l'oubli</b>, documentée depuis Ebbinghaus. Ce que vous "
            "avez construit ici ne disparaîtra pas d'un coup, mais s'estompera sans réactivation.</p>"
            "<p style='font-size:13px;line-height:1.65;color:#16202E;margin:0'>Ce qui la retient le mieux, ce "
            "n'est pas la révision — <b>c'est l'usage</b>. Appliquer ces concepts à vos vrais projets reste le "
            "moyen le plus solide de les garder.</p></div>"
            "<p style='font-size:12px;color:#5E6E7F;margin-top:14px'>Nous vous envoyons ceci sans que vous l'ayez "
            "demandé, parce qu'on regrette parfois d'avoir perdu son travail. Il vous appartient.</p>")
    return subj, _shell("Vos données, avant votre départ", body, lang)


def reminder_email(days_left: int, final: bool, lang: str = "fr") -> tuple:
    """Rappel avant effacement définitif.

    Ton : factuel et digne. On ne supplie pas, on ne culpabilise pas — on rappelle
    simplement qu'un clic suffit encore, et on redonne son travail à la personne.
    Le rappel FINAL (J-1) rejoint les données : si le premier email s'est perdu,
    c'est la dernière chance de récupérer son travail.
    """
    if lang == "en":
        if final:
            subj = "Tomorrow, your Certifizer account is erased"
            lead = ("<p style='font-size:14px;line-height:1.6;color:#16202E'>This is the last message you'll "
                    "receive from us. <b>Tomorrow, your account and all your progress are permanently erased.</b></p>"
                    "<p style='font-size:14px;line-height:1.6;color:#16202E'>If you'd rather keep it, one click "
                    "still restores everything — your progress is intact until then.</p>"
                    "<p style='font-size:13.5px;line-height:1.6;color:#16202E'>Your data is attached again, in "
                    "case the first email got lost: your <b>learning portrait</b> and your <b>raw data</b>.</p>")
            title = "Tomorrow — last chance to restore"
        else:
            subj = f"Your Certifizer account is erased in {days_left} days"
            lead = (f"<p style='font-size:14px;line-height:1.6;color:#16202E'>You asked to delete your Certifizer "
                    f"account. <b>In {days_left} days, everything is permanently erased</b> — your progress, your "
                    f"reflexes, your map.</p>"
                    "<p style='font-size:14px;line-height:1.6;color:#16202E'>If you've changed your mind, one click "
                    "restores it all. Nothing is lost yet.</p>")
            title = f"{days_left} days left"
        body = lead + ("<p style='font-size:12px;color:#5E6E7F;margin-top:16px'>If you meant to leave, you can "
                       "ignore this — it will happen on its own.</p>")
        return subj, _shell(title, body, lang)

    if final:
        subj = "Demain, votre compte Certifizer est effacé"
        lead = ("<p style='font-size:14px;line-height:1.6;color:#16202E'>C'est le dernier message que vous "
                "recevrez de notre part. <b>Demain, votre compte et toute votre progression seront effacés "
                "définitivement.</b></p>"
                "<p style='font-size:14px;line-height:1.6;color:#16202E'>Si vous préférez le garder, un clic "
                "suffit encore à tout récupérer — votre progression est intacte jusque-là.</p>"
                "<p style='font-size:13.5px;line-height:1.6;color:#16202E'>Vos données sont à nouveau jointes, "
                "au cas où le premier email se serait perdu : votre <b>portrait d'apprentissage</b> et vos "
                "<b>données brutes</b>.</p>")
        title = "Demain — dernière chance de récupérer"
    else:
        subj = f"Votre compte Certifizer sera effacé dans {days_left} jours"
        lead = (f"<p style='font-size:14px;line-height:1.6;color:#16202E'>Vous avez demandé la suppression de "
                f"votre compte Certifizer. <b>Dans {days_left} jours, tout sera effacé définitivement</b> — votre "
                f"progression, vos réflexes, votre carte.</p>"
                "<p style='font-size:14px;line-height:1.6;color:#16202E'>Si vous avez changé d'avis, un clic "
                "suffit à tout récupérer. Rien n'est encore perdu.</p>")
        title = f"Encore {days_left} jours"
    body = lead + ("<p style='font-size:12px;color:#5E6E7F;margin-top:16px'>Si votre décision est prise, vous "
                   "pouvez ignorer ce message — l'effacement se fera de lui-même.</p>")
    return subj, _shell(title, body, lang)
