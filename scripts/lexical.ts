/** Petits constructeurs de contenu Lexical (éditeur riche de Payload) pour les pages semées. */

type Node = Record<string, unknown>

const base = { format: '', indent: 0, version: 1, direction: 'ltr' as const }

export const text = (value: string, format = 0): Node => ({ type: 'text', version: 1, text: value, format, detail: 0, mode: 'normal', style: '' })

export const paragraph = (value: string): Node => ({ type: 'paragraph', ...base, textFormat: 0, children: [text(value)] })

export const heading = (value: string, tag: 'h2' | 'h3' = 'h2'): Node => ({ type: 'heading', tag, ...base, children: [text(value)] })

export const bulletList = (items: string[]): Node => ({
  type: 'list',
  listType: 'bullet',
  start: 1,
  tag: 'ul',
  ...base,
  children: items.map((value, i) => ({ type: 'listitem', value: i + 1, ...base, children: [text(value)] })),
})

export const richText = (...children: Node[]) => ({ root: { type: 'root', ...base, children } })
