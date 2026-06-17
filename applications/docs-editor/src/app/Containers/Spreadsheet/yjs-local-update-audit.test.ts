import type { SpreadsheetLocalYjsUpdateAuditState } from './yjs-local-update-audit'
import { detectLocalYjsUpdateDrift, recordSpreadsheetLocalStateChange } from './yjs-local-update-audit'
import * as Y from 'yjs'

function createAuditState(
  state: Partial<SpreadsheetLocalYjsUpdateAuditState> = {},
): SpreadsheetLocalYjsUpdateAuditState {
  return {
    sheets: [],
    sheetData: {},
    tables: [],
    namedRanges: [],
    conditionalFormats: [],
    embeds: [],
    dataValidations: [],
    charts: [],
    protectedRanges: [],
    cellXfs: new Map(),
    sharedStrings: new Map(),
    ...state,
  }
}

describe('local Yjs update drift detection', () => {
  it('reports drift when a patch-touched key differs between local state and the Yjs doc', () => {
    // Local still holds a shared string that the broadcast (the empty doc here) does not.
    const doc = new Y.Doc()
    const localState = createAuditState({
      sharedStrings: new Map([['string-id', 'value']]),
    })

    const result = detectLocalYjsUpdateDrift({
      doc,
      getLocalState: () => localState,
      patches: [[{ sharedStrings: { patches: [{ op: 'add', path: ['string-id'], value: 'value' }], inversePatches: [] } }, null]],
    })

    expect(result.observedYjsKeys).toEqual(['sharedStrings'])
    expect(result.differences).toHaveLength(1)
    expect(result.differences[0]).toMatchObject({ key: 'sharedStrings', reason: 'local-differs-from-yjs' })
  })

  it('does not report drift when the patch-touched key matches the Yjs doc', () => {
    const doc = new Y.Doc()
    doc.getMap('sharedStringsMap').set('string-id', 'value')
    const localState = createAuditState({
      sharedStrings: new Map([['string-id', 'value']]),
    })

    const result = detectLocalYjsUpdateDrift({
      doc,
      getLocalState: () => localState,
      patches: [[{ sharedStrings: { patches: [{ op: 'add', path: ['string-id'], value: 'value' }], inversePatches: [] } }, null]],
    })

    expect(result.differences).toEqual([])
  })

  it('detects local keys that changed but were not carried by the outgoing patch', () => {
    const doc = new Y.Doc()
    doc.getMap('sharedStringsMap').set('string-id', 'value')
    // Local dropped the shared string, but the outgoing patch only touches sheetData.
    recordSpreadsheetLocalStateChange('sharedStrings', new Map([['string-id', 'value']]), new Map())

    const result = detectLocalYjsUpdateDrift({
      doc,
      getLocalState: () => createAuditState({ sharedStrings: new Map() }),
      patches: [[{ sheetData: { patches: [{ op: 'replace', path: ['1', '1'], value: {} }], inversePatches: [] } }, null]],
    })

    expect(result.localChangedKeys).toEqual(['sharedStrings'])
    expect(result.differences).toHaveLength(1)
    expect(result.differences[0]).toMatchObject({ key: 'sharedStrings', reason: 'local-change-not-observed-by-yjs' })
  })

  it('does not report an omitted local change when the doc already matches local state', () => {
    const doc = new Y.Doc()
    doc.getMap('sharedStringsMap').set('string-id', 'value')
    recordSpreadsheetLocalStateChange('sharedStrings', new Map(), new Map([['string-id', 'value']]))

    const result = detectLocalYjsUpdateDrift({
      doc,
      getLocalState: () => createAuditState({ sharedStrings: new Map([['string-id', 'value']]) }),
      patches: [[{ sheetData: { patches: [{ op: 'replace', path: ['1', '1'], value: {} }], inversePatches: [] } }, null]],
    })

    expect(result.differences).toEqual([])
  })

  it('requeues an omitted local change when the outgoing patch is unrelated, then checks it later', () => {
    const doc = new Y.Doc()
    doc.getMap('sharedStringsMap').set('string-id', 'value')
    recordSpreadsheetLocalStateChange('sharedStrings', new Map([['string-id', 'value']]), new Map())

    // A `sheets`-only patch is unrelated to sharedStrings, so the change is requeued, not checked.
    const unrelated = detectLocalYjsUpdateDrift({
      doc,
      getLocalState: () => createAuditState({ sharedStrings: new Map() }),
      patches: [[{ sheets: { patches: [], inversePatches: [] } }, null]],
    })
    expect(unrelated.differences).toEqual([])

    // A subsequent sheetData patch should now surface the still-pending sharedStrings omission.
    const related = detectLocalYjsUpdateDrift({
      doc,
      getLocalState: () => createAuditState({ sharedStrings: new Map() }),
      patches: [[{ sheetData: { patches: [{ op: 'replace', path: ['1', '1'], value: {} }], inversePatches: [] } }, null]],
    })
    expect(related.differences).toHaveLength(1)
    expect(related.differences[0]).toMatchObject({ key: 'sharedStrings', reason: 'local-change-not-observed-by-yjs' })
  })

  it('compares patch-touched keys only at the paths the outgoing patch touched', () => {
    const doc = new Y.Doc()
    // The doc reflects only the current-patch row (what the broadcast applied).
    doc.getMap('sheetDataV2').set('1', [null, { values: [null, { v: 'current patch row' }] }])
    const localState = createAuditState({
      sheetData: {
        1: [
          null,
          { values: [null, { v: 'current patch row' }] },
          { values: [null, { v: 'later chunk row' }] },
        ],
      } as unknown as SpreadsheetLocalYjsUpdateAuditState['sheetData'],
    })

    const result = detectLocalYjsUpdateDrift({
      doc,
      getLocalState: () => localState,
      patches: [
        [
          {
            sheetData: {
              patches: [{ op: 'add', path: ['1'], value: [null, { values: [null, { v: 'current patch row' }] }] }],
              inversePatches: [],
            },
          },
          null,
        ],
      ],
    })

    // The later chunk row is outside the touched paths, so it must not register as drift.
    expect(result.differences).toEqual([])
  })
})
