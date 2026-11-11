import type { BaseState, DecryptedDocumentUpdate } from '@proton-docs/realtime-sdk'
import { mergeUpdates } from 'yjs'

/** About /doc's single-player flush period (docs-core `UpdateDebouncer`), so the timeline matches its granularity */
export const OWN_UPDATES_WINDOW_MS = 2_500

export type RecordedUpdate = {
  origin: 'baseState' | 'received' | 'sent'
  /** Epoch ms: the author's time for base-state and received updates, the send time for doc2's own */
  timestamp: number
  /** Plaintext yjs update */
  content: Uint8Array<ArrayBuffer>
}

type Entry = Omit<RecordedUpdate, 'content'> & { contents: Uint8Array<ArrayBuffer>[] }

/**
 * An in-memory log of every plaintext document update the session's document is made of: the base state, then each
 * update received or sent, in the order they came. doc2's own updates are merged into windows of
 * OWN_UPDATES_WINDOW_MS, which a received update ends. The SDK's `exportDebugArtifacts()` can't serve, since it holds
 * the sent and received updates encrypted only. Read by the debug menu, and meant for version history.
 */
export class UpdateRecorder {
  private entries: Entry[] = []

  constructor(
    base: BaseState,
    private readonly now: () => number = Date.now,
  ) {
    this.reset(base)
  }

  reset(base: BaseState): void {
    this.entries = base.updates.map(({ content, timestamp }) => ({
      origin: 'baseState',
      timestamp,
      contents: [content],
    }))
  }

  recordReceived({ content, timestamp }: DecryptedDocumentUpdate): void {
    this.entries.push({ origin: 'received', timestamp, contents: [content] })
  }

  recordSent(content: Uint8Array<ArrayBuffer>): void {
    const now = this.now()
    const last = this.entries.at(-1)
    if (last?.origin === 'sent' && now - last.timestamp < OWN_UPDATES_WINDOW_MS) {
      last.contents.push(content)
      return
    }
    this.entries.push({ origin: 'sent', timestamp: now, contents: [content] })
  }

  /** Merges each window only here, so recording an edit stays cheap */
  getUpdates(): RecordedUpdate[] {
    return this.entries.map(({ contents, ...entry }) => ({
      ...entry,
      content: contents.length === 1 ? contents[0] : (mergeUpdates(contents) as Uint8Array<ArrayBuffer>),
    }))
  }
}
