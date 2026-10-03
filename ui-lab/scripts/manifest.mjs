import { MANIFEST, NOT_USABLE, HAND_BUILT, CHANTIER } from '../src/manifest.js'
import fs from 'node:fs'
const esc = (s) => String(s).replace(/\|/g, '\\|')
let md = `# 21st.dev manifest — L’Observatoire\n\nEvery UI piece in \`ui-lab/\` and the 21st.dev component it is built from. Generated from \`src/manifest.js\` (\`npm run manifest\`), and rendered live on the lab's **Sources 21st** screen.\n\nRule applied: component code copied as fetched by \`get_component\`, unchanged except tokens (theme.css maps shadcn variable names onto Certifizer tokens), French copy and import paths. Each file starts with its author credit.\n\n| Piece | 21st name | Author | Demo id | 21st URL | File | Screens that use it | What changed | npm deps |\n|---|---|---|---|---|---|---|---|---|\n`
for (const m of MANIFEST) md += `| ${esc(m.piece)} | ${esc(m.name)} | @${m.author} | ${m.demo} | ${m.url} | \`${m.file}\` | ${esc(m.screens)} | ${esc(m.changes)} | ${esc(m.deps)} |\n`
md += `\n## Fetched but not usable as shipped\n\n| 21st name | Author | Demo id | Why | Replaced by |\n|---|---|---|---|---|\n`
for (const n of NOT_USABLE) md += `| ${n.name} | @${n.author} | ${n.demo} | ${esc(n.why)} | ${esc(n.replaced)} |\n`
md += `\n## Hand-built (21st has nothing usable)\n\n| Piece | File | Why |\n|---|---|---|\n`
for (const h of HAND_BUILT) md += `| ${esc(h.piece)} | \`${h.file}\` | ${esc(h.why)} |\n`
md += `\n## Direction « Chantier » — story effects (chantier.html)\n\nThe approved « Chantier » direction (\`ui-lab/chantier.html\`, source \`src/chantier/\`) tells its entry page with GSAP ScrollTrigger + Lenis. Each effect was searched, fetched with \`get_component\` and adapted from the real code (kept verbatim in \`.21st-raw/components/\`); the adaptation is the port from Motion/framer-motion springs to GSAP scrubs, with the original values.\n\n| Piece | 21st name | Author | Demo id | 21st URL | File | Screens that use it | What changed |\n|---|---|---|---|---|---|---|---|\n`
for (const m of CHANTIER) md += `| ${esc(m.piece)} | ${esc(m.name)} | @${m.author} | ${m.demo} | ${m.url} | \`${m.file}\` | ${esc(m.screens)} | ${esc(m.changes)} |\n`
md += `\nWorking screens (Aujourd'hui, Parcours, S'entraîner, Mon projet, Portrait) use one quiet GSAP entrance each and no film, per MEDIA.md.\n`
md += `\nRaw fetched payloads (component, demo, registry files) are kept in \`ui-lab/.21st-raw/\` for diffing against the files above.\n`
fs.writeFileSync(new URL('../21st-manifest.md', import.meta.url), md)
console.log('21st-manifest.md written:', MANIFEST.length, 'components')
