import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { SiteSetting } from '../payload-types'

export const getPayloadClient = cache(async () => getPayload({ config }))

export const getSettings = cache(async (): Promise<SiteSetting> => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'site-settings', depth: 1 })
})

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
