import type { DocumentAction } from '@proton/docs-shared/DocumentAction'

export type OpenResolution =
  | { kind: 'open'; nodeMeta: { volumeId: string; linkId: string } }
  | { kind: 'create'; parentLinkId?: string }
  | { kind: 'redirect'; to: 'public' }
  | { kind: 'error'; reason: 'invalidUrl' | 'slackTruncated' | 'unsupported' }

/** What the doc2 page does for a URL, given `parseOpenAction`'s result for it and its query string. */
export function resolveOpenAction(openAction: DocumentAction | null, search: string): OpenResolution {
  // Before the action: a link cut inside an ID still parses, with the marker in the ID.
  if (search.includes('[%E2%80%A6]')) {
    return { kind: 'error', reason: 'slackTruncated' }
  }
  if (!openAction) {
    return resolveMissingAction(search)
  }

  switch (openAction.mode) {
    case 'open':
      return { kind: 'open', nodeMeta: { volumeId: openAction.volumeId, linkId: openAction.linkId } }
    case 'create':
      return { kind: 'create', parentLinkId: openAction.parentLinkId }
    case 'new':
      return { kind: 'create' }
    case 'open-url-reauth':
      return { kind: 'redirect', to: 'public' }
    case 'convert':
    case 'history':
    case 'download':
    case 'copy-public':
    case 'open-url':
    case 'open-url-download':
      return { kind: 'error', reason: 'unsupported' }
  }
}

// Only a URL with no parameters at all creates a document, so a broken link never does.
function resolveMissingAction(search: string): OpenResolution {
  if (new URLSearchParams(search).size === 0) {
    return { kind: 'create' }
  }
  return { kind: 'error', reason: 'invalidUrl' }
}
