// Every screen in scope, with its lab states. Hash tokens are plain words (artifact-safe).
export const ROUTES = [
  { hash: 'lab', label: 'Laboratoire', group: 'lab', states: [] },
  // Accès
  { hash: 'accueil', label: 'Accueil', group: 'acces', states: ['Nom', 'Code de classe', 'Retrouver (email)', 'Email envoyé', 'Accès formateur'] },
  { hash: 'invitation', label: 'Invitation', group: 'acces', states: ['Vérification', 'Valide — profil présent', 'Valide — nouveau', 'Lien utilisé', 'Lien révoqué', 'Places épuisées'] },
  { hash: 'email', label: 'Email de récupération', group: 'acces', states: ['Formulaire', 'Erreur', 'Lié'] },
  { hash: 'lien', label: 'Lien magique', group: 'acces', states: ['Connexion', 'Expiré', 'Invalide'] },
  // Apprenant
  { hash: 'preparation', label: 'Ma préparation', group: 'apprenant', states: ['Normal', 'Chargement', 'Première visite', 'Séance assignée', 'Premium'] },
  { hash: 'seance', label: 'Lecteur de séance', group: 'apprenant', states: ['Question', 'Réponse juste', 'Réponse fausse', 'Erreur réseau', 'Fin de séance', 'Quitter ?'] },
  { hash: 'tester', label: 'Me tester', group: 'apprenant', states: ['Question', 'Corrigée', 'Signalée', 'Chargement', 'Aucune question', 'Erreur'] },
  { hash: 'expliquer', label: 'Expliquer', group: 'apprenant', states: ['Vide', 'Conversation', 'Réflexion…', 'Erreur'] },
  { hash: 'scenario', label: "Cas d'examen", group: 'apprenant', states: ['Vide', 'Conversation'] },
  { hash: 'relier', label: 'Relier à mon projet', group: 'apprenant', states: ['Sans projet', 'Avec projet', 'Livrable en cours'] },
  { hash: 'casreel', label: 'Cas réel', group: 'apprenant', states: ['Choisir un siège', 'Conversation', 'Réflexe proposé', 'Réflexe sauvé'] },
  { hash: 'parcours', label: 'Parcours ECO', group: 'apprenant', states: ['Domaines', 'Tâches du domaine', 'Détail tâche'] },
  { hash: 'carte', label: 'Carte mentale', group: 'apprenant', states: ['Arbre · 13 thèmes', 'Arbre · 26 tâches', 'Sujet sélectionné', 'Chemin critique', 'Présentation', 'Gratuit (26 verrouillé)'] },
  { hash: 'chemin', label: 'Chemin critique', group: 'apprenant', states: ['Premium (4 étapes)', 'Gratuit (2 + aperçu)', 'Étape 1 en cours'] },
  { hash: 'portrait', label: 'Mon portrait', group: 'apprenant', states: ['Complet', 'Trajectoire courte', 'Vide', 'Chargement'] },
  { hash: 'reglages', label: 'Réglages', group: 'apprenant', states: ['Accueil', 'Email en édition', 'Formateur (test)', 'Supprimer ?', 'Délai de grâce', 'Chargement'] },
  { hash: 'premium', label: 'Premium', group: 'apprenant', states: ['Modale', 'Fonctions intelligentes (gratuit)', 'Fonctions intelligentes (premium)'] },
  // Formateur
  { hash: 'cockpit', label: 'Cockpit formateur', group: 'formateur', states: ['Constellation', "Groupes d'action", 'Heatmap', 'Qualité des questions', 'Cohorte vide', 'Chargement', 'Erreur'] },
  { hash: 'seance-ciblee', label: 'Composer une séance', group: 'formateur', states: ['Liste', 'Suggestion ↻', 'Banque', 'Ma question', 'Correction proposée', 'Liste vide'] },
  { hash: 'invitations', label: 'Invitations', group: 'formateur', states: ['Liste', 'Vide', 'Liens copiés'] },
  // Institution
  { hash: 'institution', label: 'Vue institution', group: 'institution', states: ['Vue générale', 'Sièges épuisés'] },
]
export const GROUPS = [
  { id: 'lab', fr: 'Laboratoire' }, { id: 'acces', fr: 'Accès' }, { id: 'apprenant', fr: 'Apprenant' }, { id: 'formateur', fr: 'Formateur' }, { id: 'institution', fr: 'Institution' },
]
export const routeOf = (hash) => ROUTES.find(r => r.hash === hash) || ROUTES[0]
