import type { ContentKind } from '../normalize';

// Shared kind sets used by extractors' `supportedKinds`.
export const BOTH_KINDS: ReadonlySet<ContentKind> = new Set<ContentKind>(['html', 'plain']);

export const HTML_ONLY: ReadonlySet<ContentKind> = new Set<ContentKind>(['html']);

export const PLAIN_ONLY: ReadonlySet<ContentKind> = new Set<ContentKind>(['plain']);
