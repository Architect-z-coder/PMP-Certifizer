// axe-core on every Chantier route at 1366px and 390px (phone context asks for reduced motion), plus overflow
// and runtime-error checks. Usage: node tests/a11y-chantier.mjs [baseUrl]   (default http://127.0.0.1:5173/chantier.html)
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'

const base = process.argv[2] || 'http://127.0.0.1:5173/chantier.html'
const routes = (await import('../src/chantier/routes.js')).CHANTIER_ROUTES.map(r => r.path)
const viewports = [{ w: 1366, h: 900, name: 'desktop' }, { w: 390, h: 844, name: 'phone' }]
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
let total = 0
fs.mkdirSync('test-results/chantier', { recursive: true })
for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, reducedMotion: vp.name === 'phone' ? 'reduce' : 'no-preference' })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message.slice(0, 200)))
  for (const path of routes) {
    await page.goto(`${base}#/${path}`, { waitUntil: 'networkidle' })
    await page.evaluate((p) => { location.hash = '#/' + p }, path)
    await page.waitForTimeout(1800) // entrance tweens settle before contrast is measured
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze()
    const v = results.violations
    total += v.length
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
    const overflow = scrollW > vp.w
    const name = path || 'story'
    if (v.length || overflow) {
      console.log(`✗ ${vp.name} #/${name}: ${v.length} violations${overflow ? ` · horizontal overflow (${scrollW}px)` : ''}`)
      for (const x of v) console.log(`   - ${x.id} (${x.impact}): ${x.nodes.length} nodes · ${x.nodes[0]?.target?.join(' ')}`)
      if (overflow) total += 1
    } else console.log(`✓ ${vp.name} #/${name}`)
    if (process.env.SHOTS) await page.screenshot({ path: `test-results/chantier/${vp.name}-${name}.png`, fullPage: true })
  }
  if (errors.length) { total += errors.length; console.log(`✗ ${vp.name} runtime errors:`, errors) }
  await ctx.close()
}
await browser.close()
console.log(total === 0 ? '\nAXE (chantier): 0 findings on all routes and viewports' : `\nAXE (chantier): ${total} findings`)
process.exit(total === 0 ? 0 : 1)
