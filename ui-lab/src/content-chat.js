// Copy for the four co-thinker modes (unchanged from phase 1).
import { BookOpen, Lightbulb, Puzzle, Scale } from 'lucide-react'

export const MODES = {
  expliquer: { icon: BookOpen, title: 'Expliquer', lead: 'Posez une question sur un sujet de l’ECO 2026. Le co-penseur explique, cite la tâche concernée et vous renvoie vers la pratique.', starter: 'Expliquez-moi la différence entre risque et obstacle, avec un exemple de chantier.' },
  scenario: { icon: Puzzle, title: 'Cas d’examen', lead: 'Un scénario au format de l’examen, puis la correction raisonnée. Chaque cas est rattaché à une tâche officielle.', starter: 'Donnez-moi un cas d’examen sur la gestion des attentes des parties prenantes.' },
  relier: { icon: Lightbulb, title: 'Relier à mon projet', lead: 'Décrivez votre projet réel. Le co-penseur relie les concepts à votre situation et vous aide à produire de vrais livrables.', starter: 'Comment ce concept s’applique à mon projet ?' },
  casreel: { icon: Scale, title: 'Cas réel', lead: 'Une situation vécue, lue depuis un siège. Six étapes : cadrer, situer, diagnostiquer, explorer, concevoir, décider. Vous gardez un réflexe.', starter: 'Mon sponsor veut avancer la date de livraison de six semaines sans budget supplémentaire.' },
}
export const SEATS = [{ value: 'moa', label: 'Maître d’ouvrage', hint: 'Vous possédez l’actif, le budget, la valeur.' }, { value: 'moe', label: 'Maître d’œuvre', hint: 'Vous portez l’exécution et le contrat.' }, { value: 'both', label: 'Les deux angles', hint: 'Comparez les deux sièges côte à côte.' }]

export const CONVO = {
  expliquer: [
    ['user', 'Quelle est la différence entre un risque et un obstacle ?'],
    ['ai', 'Un risque est un événement incertain qui pourrait se produire ; un obstacle est une situation qui bloque déjà le travail. Dans l’ECO 2026, les risques relèvent de BE5 (planifier et gérer les risques) et les obstacles de BE4 (lever les obstacles et gérer les problèmes).\n\nSur votre station de pompage : « le fournisseur pourrait livrer en retard » est un risque ; « le fournisseur a annoncé trois semaines de retard » est un obstacle. Le premier se planifie, le second se lève.\n\nPour ancrer la distinction, essayez une question BE4 en mode Me tester.'],
  ],
  scenario: [
    ['user', 'Un cas d’examen sur les attentes des parties prenantes.'],
    ['ai', 'Scénario. Vous dirigez le déploiement d’un logiciel de paie. Le directeur financier attend une mise en service au 1er du mois ; l’équipe technique estime deux semaines de plus. Il n’a pas été consulté sur l’estimation.\n\nQuelle est la meilleure action ?\nA. Imposer la date du 1er à l’équipe.\nB. Rencontrer le directeur financier pour aligner l’attente sur l’estimation et ses hypothèses.\nC. Mettre en service une version partielle sans l’en informer.\nD. Escalader au sponsor.\n\nRépondez, puis je vous donne la correction raisonnée (PE5 · Aligner les attentes des parties prenantes).'],
  ],
  relier: [
    ['user', 'Comment la gouvernance de projet s’applique à ma rénovation de station de pompage ?'],
    ['ai', 'Dans votre projet, la gouvernance (BE1) répond à trois questions : qui décide quoi, à quel moment, sur quelle base. Concrètement : un comité de pilotage mensuel avec le maître d’ouvrage et l’exploitant ; des seuils de décision (tout écart supérieur à 10 % du budget remonte au comité) ; une charte qui fixe le périmètre de haut niveau.\n\nVoulez-vous que nous rédigions la charte de projet à partir de ces éléments ? Elle ira dans vos livrables.'],
  ],
  casreel: [
    ['user', 'Mon sponsor veut avancer la livraison de six semaines sans budget supplémentaire.'],
    ['ai', 'Cadrons. Depuis le siège du maître d’ouvrage, la question n’est pas « peut-on » mais « que vaut six semaines de plus tôt, et que coûte-t-il de les obtenir ».\n\nSituons : quelles activités portent le chemin critique ? Diagnostiquons : la demande vient-elle d’un engagement externe ou d’une préférence ? Explorons : compression (crashing) ou chevauchement (fast-tracking) ; chacune a un prix, en argent ou en risque.\n\n⟡ Réflexe : avant de répondre au sponsor, je qualifie l’impact sur le chemin critique, pas seulement sur la tâche.'],
  ],
}

