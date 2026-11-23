import { setDateLocales } from '@proton/shared/lib/i18n'
import { enUSLocale } from '@proton/shared/lib/i18n/dateFnLocales'
import type { HistoryEntry } from '@proton-docs/realtime-sdk'
import * as Y from 'yjs'

import { NativeVersionHistory, createVersionHistory } from './NativeVersionHistory'

function entry(timestamp: number, content: Uint8Array<ArrayBuffer> = new Uint8Array()): HistoryEntry {
  return {
    uuid: `update-${timestamp}`,
    origin: 'baseState',
    timestamp,
    authorAddress: 'test@example.com',
    content,
    acknowledged: true,
  }
}

/** The History Log of a document typed one character at a time, `text` in all, each update a minute apart */
function typed(text: string, start: Date): HistoryEntry[] {
  const doc = new Y.Doc()
  const updates: Uint8Array<ArrayBuffer>[] = []
  doc.on('update', (update) => updates.push(new Uint8Array(update)))
  ;[...text].forEach((character, index) => doc.getText('text').insert(index, character))
  return updates.map((update, index) => entry(+start + index * 60_000, update))
}

function textOf(state: Uint8Array<ArrayBuffer>) {
  const doc = new Y.Doc()
  Y.applyUpdate(doc, state)
  return doc.getText('text').toString()
}

describe('NativeVersionHistory', () => {
  beforeAll(() => {
    vi.useFakeTimers().setSystemTime(new Date('2023-07-08'))
    setDateLocales({ dateLocale: enUSLocale })
  })
  afterAll(() => {
    vi.useRealTimers()
  })

  // Copied from packages/docs-core/lib/VersionHistory/NativeVersionHistory.spec.ts, over the SDK's History Log entries
  describe('getFormattedBatchGroups', () => {
    it('Returns formatted dates and times for all the batches', () => {
      const versionHistory = new NativeVersionHistory([entry(+new Date('2023-01-01T01:00'))])

      expect(versionHistory.getFormattedBatchGroups()).toEqual([
        {
          formattedDate: 'Jan 1',
          batchIndexes: [{ formattedTime: '1:00 AM', batchIndex: 0 }],
        },
      ])
    })

    it('groups the revisions by day, newest first, each timed by its last entry', () => {
      const versionHistory = new NativeVersionHistory([
        ...Array.from({ length: 10 }, (_, minute) => entry(+new Date(`2023-01-01T01:${10 + minute}`))),
        ...Array.from({ length: 10 }, (_, minute) => entry(+new Date(`2023-01-02T09:${10 + minute}`))),
        ...Array.from({ length: 5 }, (_, minute) => entry(+new Date(`2023-01-02T10:${10 + minute}`))),
      ])

      expect(versionHistory.getFormattedBatchGroups()).toEqual([
        {
          formattedDate: 'Jan 2',
          batchIndexes: [
            { formattedTime: '10:14 AM', batchIndex: 2 },
            { formattedTime: '9:19 AM', batchIndex: 1 },
          ],
        },
        { formattedDate: 'Jan 1', batchIndexes: [{ formattedTime: '1:19 AM', batchIndex: 0 }] },
      ])
    })
  })

  it('makes a revision of every ten entries, the last one the current version', () => {
    const versionHistory = new NativeVersionHistory(typed('abcdefghijklmnopqrstuvw', new Date('2023-07-07')))

    expect(versionHistory.batchThreshold).toBe(10)
    expect(versionHistory.batches.map((batch) => batch.length)).toEqual([10, 10, 3])
    expect([0, 1, 2].map((index) => versionHistory.isCurrentBatchIndex(index))).toEqual([false, false, true])
  })

  it("merges a revision's entries and every earlier one into its state", () => {
    const versionHistory = new NativeVersionHistory(typed('abcdefghijklmnopqrstuvw', new Date('2023-07-07')))

    expect(textOf(versionHistory.getMergedUpdateForBatchIndex(0))).toBe('abcdefghij')
    expect(textOf(versionHistory.getMergedUpdateForBatchIndex(1))).toBe('abcdefghijklmnopqrst')
    expect(textOf(versionHistory.getMergedUpdateForBatchIndex(2))).toBe('abcdefghijklmnopqrstuvw')
  })

  it('batches again at another threshold, of at least one entry', () => {
    const versionHistory = new NativeVersionHistory(typed('abcde', new Date('2023-07-07')))

    versionHistory.setBatchThreshold(2)
    expect(versionHistory.batches.map((batch) => batch.length)).toEqual([2, 2, 1])

    versionHistory.setBatchThreshold(0)
    expect(versionHistory.batchThreshold).toBe(1)
    expect(versionHistory.batches).toHaveLength(5)
  })
})

describe('createVersionHistory', () => {
  it('has no revisions for an empty History Log', () => {
    expect(createVersionHistory([])).toBeUndefined()
  })

  it('has the revisions of a History Log with entries', () => {
    expect(createVersionHistory([entry(1)])?.batches).toEqual([[entry(1)]])
  })
})
