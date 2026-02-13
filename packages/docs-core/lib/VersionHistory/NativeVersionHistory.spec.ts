import { setDateLocales } from '@proton/shared/lib/i18n'
import { NativeVersionHistory } from './NativeVersionHistory'

describe('NativeVersionHistory', () => {
  describe('getFormattedBatchGroups', () => {
    jest.useFakeTimers().setSystemTime(new Date('2023-07-08'))
    setDateLocales({ dateLocale: { code: 'en-US' } })
    const versionHistory = new NativeVersionHistory(
      [
        {
          content: new Uint8Array(),
          timestamp: +new Date('2023-01-01T01:00'),
          authorAddress: 'test@example.com',
        },
      ],
      'doc',
    )

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
