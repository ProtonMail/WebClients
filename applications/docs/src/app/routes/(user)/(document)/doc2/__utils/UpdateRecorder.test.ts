import type { DecryptedDocumentUpdate } from '@proton-docs/realtime-sdk'
import { Doc, applyUpdate } from 'yjs'

import { OWN_UPDATES_WINDOW_MS, UpdateRecorder } from './UpdateRecorder'

function update(firstByte: number, timestamp: number): DecryptedDocumentUpdate {
  return {
    content: new Uint8Array([firstByte]),
    authorAddress: 'author@example.com',
    timestamp,
    signature: new Uint8Array(),
    aad: '',
  } as unknown as DecryptedDocumentUpdate
}

/** Real yjs updates, each inserting one of `texts` at the start of the same text */
function yjsEdits(...texts: string[]) {
  const doc = new Doc()
  const updates: Uint8Array<ArrayBuffer>[] = []
  doc.on('update', (content) => updates.push(content as Uint8Array<ArrayBuffer>))
  texts.forEach((text) => doc.getText('text').insert(0, text))
  return updates
}

function textOf(...updates: Uint8Array<ArrayBuffer>[]) {
  const doc = new Doc()
  updates.forEach((content) => applyUpdate(doc, content))
  return doc.getText('text').toString()
}

describe('UpdateRecorder', () => {
  test('starts from the base state, then keeps received and sent updates in the order they came, with their times', () => {
    let now = 10_000
    const [sent] = yjsEdits('a')
    const recorder = new UpdateRecorder({ commitId: 'commit-1', updates: [update(1, 100), update(2, 200)] }, () => now)

    recorder.recordReceived(update(3, 9_000))
    now = 11_000
    recorder.recordSent(sent)
    recorder.recordReceived(update(4, 11_500))

    expect(recorder.getUpdates()).toEqual([
      { origin: 'baseState', timestamp: 100, content: new Uint8Array([1]) },
      { origin: 'baseState', timestamp: 200, content: new Uint8Array([2]) },
      { origin: 'received', timestamp: 9_000, content: new Uint8Array([3]) },
      { origin: 'sent', timestamp: 11_000, content: sent },
      { origin: 'received', timestamp: 11_500, content: new Uint8Array([4]) },
    ])
  })

  test("merges doc2's own updates within one window into one, timed at the window's start", () => {
    let now = 50_000
    const [first, second, third] = yjsEdits('a', 'b', 'c')
    const recorder = new UpdateRecorder({ commitId: undefined, updates: [] }, () => now)

    recorder.recordSent(first)
    now += 1_000
    recorder.recordSent(second)
    now = 50_000 + OWN_UPDATES_WINDOW_MS
    recorder.recordSent(third)

    const updates = recorder.getUpdates()
    expect(updates.map(({ origin, timestamp }) => ({ origin, timestamp }))).toEqual([
      { origin: 'sent', timestamp: 50_000 },
      { origin: 'sent', timestamp: 50_000 + OWN_UPDATES_WINDOW_MS },
    ])
    expect(textOf(updates[0].content)).toBe('ba')
    expect(textOf(...updates.map(({ content }) => content))).toBe('cba')
  })

  test('a received update ends the window, so the order stays as the updates came', () => {
    let now = 50_000
    const [first, second] = yjsEdits('a', 'b')
    const recorder = new UpdateRecorder({ commitId: undefined, updates: [] }, () => now)

    recorder.recordSent(first)
    now += 500
    recorder.recordReceived(update(9, now))
    now += 500
    recorder.recordSent(second)

    expect(recorder.getUpdates().map(({ origin, timestamp }) => [origin, timestamp])).toEqual([
      ['sent', 50_000],
      ['received', 50_500],
      ['sent', 51_000],
    ])
  })

  test('reset starts again from the new base, and a window open before it never takes later updates', () => {
    let now = 50_000
    const [first, second] = yjsEdits('a', 'b')
    const recorder = new UpdateRecorder({ commitId: 'commit-1', updates: [update(1, 100)] }, () => now)
    recorder.recordSent(first)
    recorder.recordReceived(update(2, 50_100))

    recorder.reset({ commitId: 'commit-2', updates: [update(3, 300), update(4, 400)] })
    now += 200
    recorder.recordSent(second)

    expect(recorder.getUpdates()).toEqual([
      { origin: 'baseState', timestamp: 300, content: new Uint8Array([3]) },
      { origin: 'baseState', timestamp: 400, content: new Uint8Array([4]) },
      { origin: 'sent', timestamp: 50_200, content: second },
    ])
  })
})
