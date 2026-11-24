import type { DocumentAction } from '@proton/docs-shared/DocumentAction'

export type OpenResolution =
  /**
   * `downloadOnOpen`: Drive's Download, which saves the document as docx once it is open. `historyOnOpen`: the version
   * history, which opens once the document shows.
   */
  | { kind: 'open'; nodeMeta: { volumeId: string; linkId: string }; downloadOnOpen?: true; historyOnOpen?: true }
  | { kind: 'create'; parent?: { volumeId: string; linkId: string } }
  /**
   * A public link, which the public app opens: the link's own id comes from its sign-in, a folder's from the URL.
   * `downloadOnOpen`: Drive's Download of a public link, as for a member's document.
   */
  | { kind: 'openPublicLink'; token: string; downloadOnOpen?: true }
  /** The window a public page opens for Create a copy, which gets the document from its opener */
  | { kind: 'copyPublic' }
  | { kind: 'redirect'; to: 'public' }
  | { kind: 'error'; reason: 'invalidUrl' | 'slackTruncated' | 'unsupported' }

/**
 * What the doc2 page does for a URL, given `parseOpenAction`'s result for it and its query string. Adapted from
 * `applications/docs/src/app/routes/(user)/(document)/doc/page.tsx`, its content phase and the effect that acts on it.
 */
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
    case 'download':
      return {
        kind: 'open',
        nodeMeta: { volumeId: openAction.volumeId, linkId: openAction.linkId },
        downloadOnOpen: true,
      }
    case 'history':
      return {
        kind: 'open',
        nodeMeta: { volumeId: openAction.volumeId, linkId: openAction.linkId },
        historyOnOpen: true,
      }
    case 'create':
      return { kind: 'create', parent: { volumeId: openAction.volumeId, linkId: openAction.parentLinkId } }
    case 'new':
      return { kind: 'create' }
    case 'open-url-reauth':
      return { kind: 'redirect', to: 'public' }
    case 'open-url':
      return { kind: 'openPublicLink', token: openAction.token }
    case 'open-url-download':
      return { kind: 'openPublicLink', token: openAction.token, downloadOnOpen: true }
    case 'copy-public':
      return { kind: 'copyPublic' }
    // Not in doc2 yet: conversion
    case 'convert':
      return { kind: 'error', reason: 'unsupported' }
  }
}

/**
 * What a log line may say of a resolution: its kind, and an error's reason. Never a public link's token, which grants
 * access to the document and would leave in the logs a visitor downloads for support.
 */
export function loggableResolution(resolution: OpenResolution): { kind: OpenResolution['kind']; reason?: string } {
  return resolution.kind === 'error' ? { kind: resolution.kind, reason: resolution.reason } : { kind: resolution.kind }
}

// Only a URL with no parameters at all creates a document, so a broken link never does.
function resolveMissingAction(search: string): OpenResolution {
  if (new URLSearchParams(search).size === 0) {
    return { kind: 'create' }
  }
  return { kind: 'error', reason: 'invalidUrl' }
}
