// Turns dist/index.html (single-file build) into an artifact page body: no doctype/html/head/body wrappers, no <meta>.
import fs from 'node:fs'
let html = fs.readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8')
html = html.replace(/<!DOCTYPE[^>]*>/i, '').replace(/<\/?html[^>]*>/gi, '').replace(/<\/?head[^>]*>/gi, '').replace(/<\/?body[^>]*>/gi, '').replace(/<meta[^>]*>/gi, '')
fs.writeFileSync(new URL('../dist/artifact.html', import.meta.url), html.trim() + '\n')
console.log('dist/artifact.html', Math.round(html.length / 1024), 'kB')
