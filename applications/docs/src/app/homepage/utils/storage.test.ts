import { storageMessages } from '../messages/storage'
import { formatStorageSize, getStorageLevel, getStoragePercentage } from './storage'

const messages = storageMessages.storage

describe('formatStorageSize', () => {
  test.each([
    [0, '0 bytes'],
    [1, '1 byte'],
    [1023, '1023 bytes'],
    [1024, '1.00 KB'],
    [1.5 * 1024 ** 2, '1.50 MB'],
    [2 * 1024 ** 3, '2.00 GB'],
    // As Proton's `humanSize`, it stops at GB.
    [3 * 1024 ** 4, '3072.00 GB'],
  ])('formats %d bytes as Proton does: %s', (bytes, expected) => {
    expect(formatStorageSize(bytes, messages)).toBe(expected)
  })
})

describe('getStoragePercentage', () => {
  test('is 0 without a maximum or a used space', () => {
    expect(getStoragePercentage({ usedSpace: 10, maxSpace: 0 })).toBe(0)
    expect(getStoragePercentage({ usedSpace: 0, maxSpace: 10 })).toBe(0)
  })

  test('rounds up to four decimals', () => {
    expect(getStoragePercentage({ usedSpace: 1, maxSpace: 3 })).toBe(33.3334)
  })
})

describe('getStorageLevel', () => {
  test.each([
    [0, 'success'],
    [49.9, 'success'],
    [50, 'warning'],
    [79.9, 'warning'],
    [80, 'danger'],
    [120, 'danger'],
  ])('%d%% is %s, as Proton’s getMeterColor', (percentage, expected) => {
    expect(getStorageLevel(percentage)).toBe(expected)
  })
})
