import type { Access, FieldAccess } from 'payload'

type Role = 'admin' | 'editor'
type UserLike = { role?: Role } | null | undefined

export const isAdmin: Access = ({ req }) => (req.user as UserLike)?.role === 'admin'
export const isStaff: Access = ({ req }) => Boolean(req.user)
export const isAdminField: FieldAccess = ({ req }) => (req.user as UserLike)?.role === 'admin'
export const isStaffField: FieldAccess = ({ req }) => Boolean(req.user)
/** Personnel only (admin ou éditeur) — exclut les comptes clients. */
export const isStaffRole: Access = ({ req }) => (req.user as UserLike)?.role === 'admin' || (req.user as UserLike)?.role === 'editor'
export const anyone: Access = () => true

/** Lecture publique des éléments publiés, tout pour le personnel connecté. */
export const publishedOrStaff: Access = ({ req }) => {
  if (req.user) return true
  return { status: { equals: 'published' } }
}
