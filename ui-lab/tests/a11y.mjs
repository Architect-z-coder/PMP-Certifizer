// Runs axe-core on every lab route at 1366px and 390px, with and without reduced motion.
// Usage: node tests/a11y.mjs [baseUrl]   (default http://localhost:4173)
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'

const base = process.argv[2] || 'http://localhost:4173'
const routes = (await import('../src/routes.js')).ROUTES.map(r => r.hash)
const viewports = [{ w: 1366, h: 900, name: 'desktop' }, { w: 390, h: 844, name: 'phone' }]
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
let total = 0
const report = []
fs.mkdirSync('test-results', { recursive: true })
for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, reducedMotion: vp.name === 'phone' ? 'reduce' : 'no-preference' })
  const page = await ctx.newPage()
  for (const hash of routes) {
    await page.goto(`${base}/#${hash}`, { waitUntil: 'networkidle' })
    await page.evaluate((h) => { location.hash = h }, hash)
    await page.waitForTimeout(250)
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze()
    const v = results.violations
    total += v.length
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
    const overflow = scrollW > vp.w
    report.push({ route: hash, viewport: vp.name, violations: v.length, overflow })
    if (v.length || overflow) {
      console.log(`✗ ${vp.name} #${hash}: ${v.length} violations${overflow ? ` · horizontal overflow (${scrollW}px)` : ''}`)
      for (const x of v) console.log(`   - ${x.id} (${x.impact}): ${x.nodes.length} nodes · ${x.nodes[0]?.target?.join(' ')}`)
      if (overflow) total += 1
    } else console.log(`✓ ${vp.name} #${hash}`)
    if (process.env.SHOTS) await page.screenshot({ path: `test-results/${vp.name}-${hash}.png`, fullPage: true })
  }
  await ctx.close()
}
await browser.close()
fs.writeFileSync('test-results/a11y.json', JSON.stringify(report, null, 2))
console.log(total === 0 ? '\nAXE: 0 findings on all routes and viewports' : `\nAXE: ${total} findings`)
process.exit(total === 0 ? 0 : 1)
