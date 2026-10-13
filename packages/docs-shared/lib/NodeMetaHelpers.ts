import type { NodeMeta, PublicNodeMeta } from './BasicTypes'

export type AnyNodeMeta = NodeMeta | PublicNodeMeta

export function isPublicNodeMeta(meta: NodeMeta | PublicNodeMeta): meta is PublicNodeMeta {
  return 'token' in meta
}

export function isPrivateNodeMeta(meta: NodeMeta | PublicNodeMeta): meta is NodeMeta {
  return 'volumeId' in meta
}

/**
 * If private node meta, returns the volumeId and linkId as a concatenated string.
 * If public node meta, returns the linkId.
 */
export function nodeMetaUniqueId(meta: NodeMeta | PublicNodeMeta): string {
  if (isPublicNodeMeta(meta)) {
    return `${meta.linkId}`
  }
  return `${meta.volumeId}-${meta.linkId}`
}

export function areNodeMetasEqual(a: NodeMeta | PublicNodeMeta, b: NodeMeta | PublicNodeMeta): boolean {
  if (isPublicNodeMeta(a) && !isPublicNodeMeta(b)) {
    return false
  }
  if (isPublicNodeMeta(b) && !isPublicNodeMeta(a)) {
    return false
  }
  if (isPublicNodeMeta(a) && isPublicNodeMeta(b)) {
    return a.token === b.token && a.linkId === b.linkId
  }

  if (isPublicNodeMeta(a) || isPublicNodeMeta(b)) {
    throw new Error('Unhandled public node meta comparison')
  }

  return a.volumeId === b.volumeId && a.linkId === b.linkId
}
