import type { Metadata } from 'next'
import { CartPageView } from './CartPageView'

export const metadata: Metadata = { title: 'Mon panier', robots: { index: false, follow: true } }

export default function PanierPage() {
  return <CartPageView />
}
