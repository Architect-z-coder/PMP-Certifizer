import React, { useEffect } from 'react'
import { Mail, Copy, Users } from 'lucide-react'
import { INVITATIONS } from '../data.js'
import Table05 from '@/components/21st/data-table'
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose } from '@/components/21st/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { toast } from 'sonner'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, PageHead, EmptyState, TierBadge } from './_shared.jsx'

const STATUS = { pending: ['En attente', 2], accepted: ['Acceptée', 3], revoked: ['Révoquée', 0] }
export default function Invitations({ state }) {
  const list = state === 'Vide' ? [] : INVITATIONS
  useEffect(() => { if (state === 'Liens copiés') toast('1 lien copié', { description: 'Collez-le dans votre message à l’apprenant.' }) }, [state])
  const rows = list.map((i, k) => ({ id: String(k), name: i.who, date: i.email, status: i.status, amount: i.link, role: i.role }))
  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <PageHead kicker="Invitations · cohorte PMP-2026-A · 14 / 20 sièges" title="Un lien par personne, à usage unique.">
        <Drawer side="right">
          <DrawerTrigger asChild><Button><Mail className="mr-2 size-4" aria-hidden="true" /> Créer des liens</Button></DrawerTrigger>
          <DrawerContent title="Créer des liens" description="Le lien rattache un profil existant sans perdre sa progression. Il peut être révoqué tant qu’il n’est pas utilisé." className="w-[380px]">
            <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); toast('Liens créés', { description: '2 liens prêts à copier.' }) }}>
              <div className="grid gap-1.5"><Label htmlFor="inv-list">Noms ou emails, un par ligne</Label><textarea id="inv-list" className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder={'Nadia\nk.exemple@formation.example'} /><p className="text-xs text-muted-foreground">Les emails sont reconnus automatiquement.</p></div>
              <div className="grid gap-1.5"><Label htmlFor="inv-role">Rôle</Label><Select defaultValue="learner"><SelectTrigger id="inv-role"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="learner">Apprenant·es</SelectItem><SelectItem value="trainer">Formateur</SelectItem></SelectContent></Select></div>
              <DrawerClose asChild><Button type="submit">Créer les liens</Button></DrawerClose>
            </form>
          </DrawerContent>
        </Drawer>
      </PageHead>
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0"><div><CardTitle>Invitations de la cohorte · {list.length}</CardTitle><CardDescription>Code de classe PMP-2026-A partageable à tout moment.</CardDescription></div>{list.some(i => i.status === 'pending') && <Button variant="secondary" size="sm" onClick={() => toast('1 lien copié')}><Copy className="mr-2 size-3.5" aria-hidden="true" /> Copier les liens en attente</Button>}</CardHeader>
        <CardContent>
          {list.length === 0 ? <EmptyState className="max-w-none" icons={[Mail, Users]} title="Aucune invitation pour l’instant" description="Créez vos premiers liens, ou partagez le code de classe PMP-2026-A." /> : (
            <Table05 data={rows} className="w-full space-y-4" searchPlaceholder="Rechercher un nom, un email…" columns={[
              { accessorKey: 'name', header: 'Personne', cell: ({ row }) => <span className="font-medium">{row.getValue('name')} {row.original.role === 'trainer' && <Badge variant="outline" className="ml-1 font-normal">formateur</Badge>}</span> },
              { accessorKey: 'date', header: 'Email' },
              { accessorKey: 'status', header: 'Statut', cell: ({ row }) => <TierBadge tier={STATUS[row.getValue('status')][1]}>{STATUS[row.getValue('status')][0]}</TierBadge> },
              { accessorKey: 'amount', header: 'Lien', cell: ({ row }) => row.getValue('amount') ? <span className="flex items-center gap-2"><code className="text-xs">{row.getValue('amount')}</code><Button variant="ghost" size="sm" aria-label={`Copier le lien de ${row.original.name}`} onClick={() => toast('1 lien copié')}><Copy className="size-3.5" aria-hidden="true" /></Button><Button variant="ghost" size="sm" className="text-destructive">Révoquer</Button></span> : <span className="text-muted-foreground">—</span> },
            ]} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
