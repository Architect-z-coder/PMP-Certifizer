import { chromium } from 'playwright'
const routes = (await import('../src/routes.js')).ROUTES
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage()
const errors = []
page.on('pageerror', e => errors.push(['pageerror', page.url(), e.message.slice(0, 300)]))
page.on('console', m => { if (m.type() === 'error') errors.push(['console', page.url(), m.text().slice(0, 300)]) })
for (const r of routes) {
  await page.goto(`http://localhost:4173/#${r.hash}`, { waitUntil: 'networkidle' })
  await page.evaluate((h) => { location.hash = h }, r.hash)
  await page.waitForTimeout(300)
  const txt = await page.evaluate(() => document.body.innerText.length)
  const states = r.states.length
  // cycle states via lab select
  for (let i = 1; i < states; i++) {
    const sel = page.locator('.lab-panel select').first()
    if (await sel.count()) { await sel.selectOption(String(i)); await page.waitForTimeout(150) }
  }
  console.log(r.hash, txt > 200 ? 'ok' : 'EMPTY', txt)
}
console.log('errors', errors.length); for (const e of errors) console.log(e.join(' | '))
await browser.close()
