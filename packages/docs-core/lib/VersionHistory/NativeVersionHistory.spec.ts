import { setDateLocales } from '@proton/shared/lib/i18n'
import { NativeVersionHistory } from './NativeVersionHistory'

describe('NativeVersionHistory', () => {
  describe('getFormattedBatchGroups', () => {
    jest.useFakeTimers().setSystemTime(new Date('2023-07-08'))
    setDateLocales({ dateLocale: { code: 'en-US' } })
    const versionHistory = new NativeVersionHistory({
      byteSize: 12,
      commitId: '',
      updates: [
        {
          content: new Uint8Array(),
          signature: new Uint8Array(),
          authorAddress: '',
          aad: '',
          timestamp: +new Date('2023-01-01T01:00'),
          byteSize: () => 12,
        },
      ],
      numberOfUpdates: () => 0,
      needsSquash: () => false,
      squashedRepresentation: () => new Uint8Array(),
    })

    it('Returns formatted dates and times for all the batches', () => {
      expect(versionHistory.getFormattedBatchGroups()).toEqual([
        {
          formattedDate: 'Jan 1',
          batchIndexes: [{ formattedTime: '1:00 AM', batchIndex: 0 }],
        },
      ])
    })
  })
})
