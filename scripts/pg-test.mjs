// PostgreSQL local éphémère pour tester les migrations : node scripts/pg-test.mjs <dossierDonnées> [port]
// Démarre, crée la base « elisaglam », puis reste actif jusqu'à Ctrl+C.
import EmbeddedPostgres from 'embedded-postgres'
import fs from 'node:fs'

const [, , dir, portArg] = process.argv
const port = Number(portArg) || 54329
const fresh = !fs.existsSync(`${dir}/PG_VERSION`)

const pg = new EmbeddedPostgres({ databaseDir: dir, user: 'postgres', password: 'postgres', port, persistent: true })
if (fresh) await pg.initialise()
await pg.start()
if (fresh) await pg.createDatabase('elisaglam')
console.log(`PostgreSQL prêt : postgres://postgres:postgres@localhost:${port}/elisaglam`)

const stop = async () => {
  await pg.stop()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
setInterval(() => {}, 1 << 30)
