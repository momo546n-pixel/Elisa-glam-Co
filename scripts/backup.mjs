// Sauvegarde locale (SQLite + images) : npm run backup
// En production (PostgreSQL), voir docs/SAUVEGARDE.md.
import fs from 'node:fs'
import path from 'node:path'

const now = new Date()
const pad = (n) => String(n).padStart(2, '0')
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`
const dest = path.join('backups', stamp)
fs.mkdirSync(dest, { recursive: true })

let copied = 0
const db = path.join('data', 'elisaglam.db')
if (fs.existsSync(db)) {
  fs.copyFileSync(db, path.join(dest, 'elisaglam.db'))
  copied++
}
if (fs.existsSync('media')) {
  fs.cpSync('media', path.join(dest, 'media'), { recursive: true })
  copied++
}
console.log(copied ? `Sauvegarde créée : ${dest}` : 'Rien à sauvegarder (ni base SQLite ni dossier media).')
