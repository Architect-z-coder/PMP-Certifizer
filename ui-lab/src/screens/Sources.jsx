import React from 'react'
import { ExternalLink } from 'lucide-react'
import { MANIFEST, NOT_USABLE, HAND_BUILT } from '../manifest.js'
import Table05 from '@/components/21st/data-table'
import { Accordion01 } from '@/components/21st/accordion'
import { StatsCard } from '@/components/21st/stats-card'
import { Boxes, FileCode2, Hammer, Ban } from 'lucide-react'
import { PageHead, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from './_shared.jsx'

const columns = [
  { accessorKey: 'piece', header: 'Pièce', cell: ({ row }) => <span className="font-medium">{row.getValue('piece')}</span> },
  { accessorKey: 'name', header: 'Composant 21st', cell: ({ row }) => <a className="inline-flex items-center gap-1 underline-offset-2 hover:underline" href={row.original.url} target="_blank" rel="noreferrer">{row.getValue('name')}<ExternalLink className="size-3" aria-hidden="true" /><span className="sr-only"> (21st.dev, nouvel onglet)</span></a> },
  { accessorKey: 'author', header: 'Auteur', cell: ({ row }) => <span>@{row.getValue('author')}</span> },
  { accessorKey: 'demo', header: 'Demo id', cell: ({ row }) => <code className="text-xs">{row.getValue('demo')}</code> },
  { accessorKey: 'file', header: 'Fichier', cell: ({ row }) => <code className="text-xs">{row.getValue('file')}</code> },
  { accessorKey: 'screens', header: 'Écrans' },
  { accessorKey: 'changes', header: 'Modifications', cell: ({ row }) => <span className="text-muted-foreground">{row.getValue('changes')}</span> },
]

export default function Sources() {
  const unchanged = MANIFEST.filter(m => /^Aucun/.test(m.changes)).length
  return (
    <div className="page" style={{ maxWidth: 1240 }}>
      <PageHead kicker="Preuve de provenance · ui-lab/21st-manifest.md" title="Sources 21st.dev" lead="Chaque pièce de l’interface, le composant 21st dont elle vient, son auteur, l’identifiant de la démo et ce qui a changé. Ce tableau est lui-même le composant « Data Table » de @ephraimduncan." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Composants 21st" value={String(MANIFEST.length)} icon={<Boxes className="size-4 text-muted-foreground" aria-hidden="true" />} change="code copié" changeType="positive" changeNote="via get_component" />
        <StatsCard title="Sans aucune modification" value={String(unchanged)} icon={<FileCode2 className="size-4 text-muted-foreground" aria-hidden="true" />} change="jetons seulement" changeType="positive" changeNote="(theme.css)" />
        <StatsCard title="Récupérés mais inutilisables" value={String(NOT_USABLE.length)} icon={<Ban className="size-4 text-muted-foreground" aria-hidden="true" />} change="remplacés" changeType="negative" changeNote="fichiers d’aide absents du registre" />
        <StatsCard title="Construits à la main" value={String(HAND_BUILT.length)} icon={<Hammer className="size-4 text-muted-foreground" aria-hidden="true" />} change="listés" changeType="negative" changeNote="ci-dessous" />
      </div>
      <Table05 columns={columns} data={MANIFEST} pageSize={10} searchPlaceholder="Filtrer (pièce, auteur, écran…)" className="w-full space-y-4" />
      <div className="section grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle><h2 className="text-xl">Récupérés sur 21st, mais inutilisables tels quels</h2></CardTitle><CardDescription>Le registre ne livrait pas leurs fichiers d’aide. Chacun a été remplacé par un composant 21st complet.</CardDescription></CardHeader>
          <CardContent><Accordion01 className="w-full" items={NOT_USABLE.map(n => ({ id: String(n.demo), title: <span>{n.name} <span className="text-muted-foreground">· @{n.author} · {n.demo}</span></span>, content: <span>{n.why} <strong>Remplacé par :</strong> {n.replaced}.</span> }))} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle><h2 className="text-xl">Construits à la main</h2></CardTitle><CardDescription>Uniquement là où 21st n’a rien d’utilisable.</CardDescription></CardHeader>
          <CardContent><ul className="space-y-3 text-sm">{HAND_BUILT.map(h => <li key={h.piece}><p className="font-medium">{h.piece} <Badge variant="secondary" className="ml-1 font-normal"><code className="text-xs">{h.file}</code></Badge></p><p className="text-muted-foreground">{h.why}</p></li>)}</ul></CardContent>
        </Card>
      </div>
    </div>
  )
}
