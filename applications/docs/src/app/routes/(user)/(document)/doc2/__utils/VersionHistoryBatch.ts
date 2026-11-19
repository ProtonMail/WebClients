import type { HistoryEntry } from '@proton-docs/realtime-sdk'

/**
 * Adapted from `packages/docs-core/lib/VersionHistory/VersionHistoryBatch.ts`, which doc2 must not import: its types
 * only, over the SDK's History Log, whose entries already hold the decompressed update.
 */
export type VersionHistoryUpdate = Pick<HistoryEntry, 'content' | 'timestamp' | 'authorAddress'>

/** One Revision: consecutive History Log entries, timed by the last one */
export type VersionHistoryBatch = VersionHistoryUpdate[]
