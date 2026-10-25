import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { fr } from '@payloadcms/translations/languages/fr'
import sharp from 'sharp'

import { migrations } from './migrations'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Products } from './collections/Products'
import { Orders } from './collections/Orders'
import { DeliveryZones } from './collections/DeliveryZones'
import { PromoCodes } from './collections/PromoCodes'
import { Pages } from './collections/Pages'
import { Reviews } from './collections/Reviews'
import { Messages } from './collections/Messages'
import { SiteSettings } from './globals/SiteSettings'
import { Homepage } from './globals/Homepage'
import { Faq } from './globals/Faq'
import { SizeGuide } from './globals/SizeGuide'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const databaseUrl = process.env.DATABASE_URL ?? 'file:./data/elisaglam.db'
const usePostgres = databaseUrl.startsWith('postgres')
const useS3 = Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL,
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' — Administration Elisa’glam&Co',
      description: 'Administration de la boutique Elisa’glam&Co',
    },
    importMap: { baseDir: path.resolve(dirname) },
    components: {
      beforeDashboard: ['@/components/admin/Dashboard#Dashboard'],
    },
  },
  collections: [Users, Media, Categories, Products, Orders, DeliveryZones, PromoCodes, Pages, Reviews, Messages],
  globals: [SiteSettings, Homepage, Faq, SizeGuide],
  graphQL: { disable: true },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: usePostgres
    ? postgresAdapter({ pool: { connectionString: databaseUrl }, prodMigrations: migrations })
    : sqliteAdapter({ client: { url: databaseUrl } }),
  sharp,
  i18n: { supportedLanguages: { fr }, fallbackLanguage: 'fr' },
  plugins: [
    ...(useS3
      ? [
          s3Storage({
            collections: { media: true },
            bucket: process.env.S3_BUCKET!,
            config: {
              region: process.env.S3_REGION ?? 'auto',
              endpoint: process.env.S3_ENDPOINT || undefined,
              forcePathStyle: Boolean(process.env.S3_ENDPOINT),
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID!,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
              },
            },
          }),
        ]
      : []),
  ],
})
