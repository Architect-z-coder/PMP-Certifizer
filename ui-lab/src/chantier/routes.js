// Hash routes of the Chantier app. "" = story (entry page); the rest are working screens.
export const CHANTIER_ROUTES = [
  { path: '', label: 'Accueil (récit)', story: true },
  { path: 'aujourdhui', label: "Aujourd'hui" },
  { path: 'parcours', label: 'Parcours' },
  { path: 'entrainer', label: 'S’entraîner' },
  { path: 'projet', label: 'Mon projet' },
  { path: 'portrait', label: 'Portrait' },
]
export const parseHash = () => (location.hash || '#/').replace(/^#\/?/, '').split('?')[0]
