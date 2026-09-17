import { DocState } from '@proton/docs-shared/lib/Doc/DocState'
import { Array as YArray, Doc, Map as YMap, encodeStateAsUpdate } from 'yjs'

const docStateLogger = {
  debug: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  getLogs: () => '',
  downloadLogs: () => {},
  clearLogs: () => {},
  setEnabled: () => {},
}

/** A persisted-format fixture, applied only after the editor installs its observers. */
export function createFixtureUpdate() {
  const fixture = new Doc()
  fixture.getArray('sheets').push([{ sheetId: 1, title: 'Standalone fixture', rowCount: 100, columnCount: 26 }])
  const rows = new YArray()
  rows.push([null])
  for (const cells of [
    [
      { userEnteredValue: { stringValue: 'Quantity' } },
      { userEnteredValue: { stringValue: 'Price' } },
      { userEnteredValue: { stringValue: 'Total' } },
    ],
    [
      { userEnteredValue: { numberValue: 2 } },
      { userEnteredValue: { numberValue: 3 } },
      { userEnteredValue: { formulaValue: '=A2*B2' }, effectiveValue: { numberValue: 6 } },
    ],
  ]) {
    const row = new YMap()
    const values = new YArray()
    values.push([
      null,
      ...cells.map((cell) => ({
        effectiveValue: cell.userEnteredValue,
        formattedValue: String(
          Object.values(('effectiveValue' in cell && cell.effectiveValue) || cell.userEnteredValue)[0],
        ),
        ...cell,
      })),
    ])
    row.set('values', values)
    rows.push([row])
  }
  fixture.getMap('sheetDataV2').set('1', rows)
  const kv = fixture.getMap('kv')
  kv.set('version', 2)
  kv.set('locale', 'en-us')
  kv.set('defaultCurrency', 'USD')
  const update = new Uint8Array(encodeStateAsUpdate(fixture))
  fixture.destroy()
  return update
}

export function createStandaloneSession(onReady: () => void, onError: (error: unknown) => void) {
  let loaded = false
  let destroyed = false
  // The real DocState retains guards, awareness, and update propagation listeners.
  // Outbound transport terminates locally; no websocket or server is created.
  const docState = new DocState(
    {
      docStateRequestsPropagationOfUpdate: (message) =>
        docStateLogger.debug('Standalone update', message.type.wrapper),
      handleAwarenessStateUpdate: (states) => docStateLogger.debug('Standalone awareness', states.length),
      handleErrorWhenReceivingDocumentUpdate: onError,
      handleReceivedEverythingFromRTS: onReady,
    },
    docStateLogger,
  )
  docState.receiveMessage({ type: { wrapper: 'du' }, content: createFixtureUpdate() })
  return {
    docState,
    editorLoaded() {
      if (loaded || destroyed) {
        return
      }
      loaded = true
      docState.onEditorReadyToReceiveUpdates()
      onReady()
    },
    destroy() {
      if (destroyed) {
        return
      }
      destroyed = true
      docState.destroy()
      docState.getDoc().destroy()
    },
  }
}
