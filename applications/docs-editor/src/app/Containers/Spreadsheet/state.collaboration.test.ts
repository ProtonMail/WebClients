import { act, renderHook } from '@testing-library/react'
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate } from 'y-protocols/awareness'
import * as Y from 'yjs'
import type { SheetsDocumentAdapter } from './contract/SheetsDocumentAdapter'
import { useProtonSheetsState } from './state'

// Keep Proton's permission wiring and the vendored Yjs/awareness hooks real;
// the calculation engine and canvas are unrelated to leader election.
jest.mock('@rowsncolumns/spreadsheet-state', () => {
  const spreadsheetState = {
    activeSheetId: 1,
    activeCell: { rowIndex: 1, columnIndex: 1 },
    getEffectiveFormat: () => ({}),
    onChangeActiveSheet: jest.fn(),
    enqueueGraphOperation: jest.fn(),
    calculateNow: jest.fn().mockResolvedValue(undefined),
  }
  return {
    useSpreadsheetState: () => spreadsheetState,
    useSearch: () => ({}),
  }
})
jest.mock('@rowsncolumns/spreadsheet', () => ({
  defaultSpreadsheetTheme: {},
  createNewSheet: (sheetId: number, name: string) => ({ sheetId, name, index: 0 }),
  useSpreadsheet: () => ({}),
}))
jest.mock('@rowsncolumns/charts', () => ({ useCharts: () => ({}) }))
jest.mock('@rowsncolumns/ui', () => ({
  useIsomorphicLayoutEffect: jest.requireActual('react').useLayoutEffect,
}))
jest.mock('@rowsncolumns/grid', () => ({ Align: { center: 'center' } }))
jest.mock('./components/utils', () => ({
  useEvent: (callback: (...args: unknown[]) => unknown) => callback,
}))
jest.mock('./locale', () => ({
  useAccountLocale: () => 'en-US',
  useLocaleAuto: () => 'en-US',
  getCurrencyFromLocale: () => 'USD',
}))
jest.mock('./constants', () => ({ CURRENCY_SYMBOL: () => '$' }))
jest.mock('./getAccentColorForUsername', () => ({ getAccentColorForUsername: () => '#000000' }))

const mockSession = {
  canEdit: true,
  receivedEverythingFromRTS: false,
  userName: 'editor@example.com',
  logger: { info: jest.fn(), error: jest.fn() },
  versionInfo: { version: '1.0' },
}
jest.mock('./SheetsDependenciesProvider', () => ({ useSheetsDependencies: () => mockSession }))

type Permissions = Pick<Parameters<typeof useProtonSheetsState>[0], 'isReadonly' | 'isConversionFlow'>

function setup({ localId = 1, peerId = 2, peerCanWrite = true, canEdit = true } = {}) {
  const doc = new Y.Doc()
  doc.clientID = localId
  const awareness = new Awareness(doc)
  const peerDoc = new Y.Doc()
  peerDoc.clientID = peerId
  const peerAwareness = new Awareness(peerDoc)
  peerAwareness.setLocalStateField('canWrite', peerCanWrite)
  const receivePeerAwareness = () => {
    applyAwarenessUpdate(awareness, encodeAwarenessUpdate(peerAwareness, [peerId]), 'test-peer')
  }
  receivePeerAwareness()
  mockSession.canEdit = canEdit

  const deps = {
    colorMode: 'light' as const,
    functions: undefined,
    docState: { awareness, getDoc: () => doc } as unknown as SheetsDocumentAdapter,
    pushPatches: jest.fn(),
    hasBasePatchesStored: jest.fn().mockResolvedValue(true),
    isPatchesStorageEnabled: false,
    isDriftDetectionEnabled: false,
    shouldUseCustomYjsInitialization: false,
    storeAction: jest.fn(),
  }
  const hook = renderHook((permissions: Permissions) => useProtonSheetsState({ ...deps, ...permissions }), {
    initialProps: { isReadonly: false, isConversionFlow: false },
  })

  return {
    ...hook,
    awareness,
    setPeerCanWrite(value: boolean) {
      act(() => {
        peerAwareness.setLocalStateField('canWrite', value)
        receivePeerAwareness()
      })
    },
    destroy() {
      hook.unmount()
      awareness.destroy()
      peerAwareness.destroy()
      doc.destroy()
      peerDoc.destroy()
    },
  }
}

describe('Proton Sheets calculation leader permissions', () => {
  let session: ReturnType<typeof setup> | undefined

  afterEach(() => {
    session?.destroy()
    session = undefined
  })

  it('excludes a viewer even when it has the lowest Yjs client ID', () => {
    session = setup({ canEdit: false })

    expect(session.awareness.getLocalState()?.canWrite).toBe(false)
    expect(session.result.current.yjsState.isLeader).toBe(false)
  })

  it('elects an editor over a viewer with a lower Yjs client ID', () => {
    session = setup({ localId: 2, peerId: 1, peerCanWrite: false })

    expect(session.awareness.getLocalState()?.canWrite).toBe(true)
    expect(session.result.current.yjsState.isLeader).toBe(true)
  })

  it('gives up leadership when edit permission is revoked and restores it when granted', () => {
    session = setup()
    expect(session.result.current.yjsState.isLeader).toBe(true)

    mockSession.canEdit = false
    session.rerender({ isReadonly: false, isConversionFlow: false })
    expect(session.awareness.getLocalState()?.canWrite).toBe(false)
    expect(session.result.current.yjsState.isLeader).toBe(false)

    mockSession.canEdit = true
    session.rerender({ isReadonly: false, isConversionFlow: false })
    expect(session.awareness.getLocalState()?.canWrite).toBe(true)
    expect(session.result.current.yjsState.isLeader).toBe(true)
  })

  it('re-elects the eligible editor when a lower-ID peer becomes a viewer', () => {
    session = setup({ localId: 2, peerId: 1 })
    expect(session.result.current.yjsState.isLeader).toBe(false)

    session.setPeerCanWrite(false)
    expect(session.result.current.yjsState.isLeader).toBe(true)

    session.setPeerCanWrite(true)
    expect(session.result.current.yjsState.isLeader).toBe(false)
  })

  it('temporarily removes a readonly editor from the election', () => {
    session = setup()
    expect(session.result.current.yjsState.isLeader).toBe(true)

    session.rerender({ isReadonly: true, isConversionFlow: false })
    expect(session.awareness.getLocalState()?.canWrite).toBe(false)
    expect(session.result.current.yjsState.isLeader).toBe(false)

    session.rerender({ isReadonly: false, isConversionFlow: false })
    expect(session.awareness.getLocalState()?.canWrite).toBe(true)
    expect(session.result.current.yjsState.isLeader).toBe(true)
  })

  it('keeps conversion writes eligible only for a user with edit permission', () => {
    session = setup()
    session.rerender({ isReadonly: true, isConversionFlow: true })
    expect(session.awareness.getLocalState()?.canWrite).toBe(true)
    expect(session.result.current.yjsState.isLeader).toBe(true)

    mockSession.canEdit = false
    session.rerender({ isReadonly: true, isConversionFlow: true })
    expect(session.awareness.getLocalState()?.canWrite).toBe(false)
    expect(session.result.current.yjsState.isLeader).toBe(false)
  })
})
