// Lists the elements that push the page wider than the phone viewport. Usage: node tests/overflow.mjs lab preparation …
import { chromium } from 'playwright'
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage()
for (const hash of process.argv.slice(2)) {
  await page.goto(`http://localhost:4173/#${hash}`, { waitUntil: 'networkidle' }); await page.waitForTimeout(300)
  const out = await page.evaluate(() => {
    const clipped = (el) => { for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'hidden' || o === 'auto' || o === 'scroll' || o === 'clip') return true; if (p.tagName === 'svg') return true } return false }
    const bad = []
    for (const el of document.querySelectorAll('body *')) { if (el.closest('.lab-bar')) continue; const r = el.getBoundingClientRect(); if (r.right > 391 && r.width > 0 && !clipped(el)) bad.push({ tag: el.tagName.toLowerCase(), cls: (el.className?.baseVal ?? el.className ?? '').toString().slice(0, 90), right: Math.round(r.right), w: Math.round(r.width), text: (el.textContent || '').trim().slice(0, 30) }) }
    bad.sort((a, b) => b.right - a.right)
    return { sw: document.documentElement.scrollWidth, bad: bad.slice(0, 10) }
  })
  console.log('#' + hash, 'scrollWidth', out.sw); for (const b of out.bad) console.log('  ', b.right, b.w, b.tag, b.cls, '|', b.text)
}
await browser.close()
