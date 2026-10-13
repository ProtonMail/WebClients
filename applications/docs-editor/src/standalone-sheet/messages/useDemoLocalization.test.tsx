import { act, renderHook } from '@testing-library/react'
import { createSheetsMessages } from '../../app/Containers/adapters/sheets/sheetsMessages/createSheetsMessages'
import type { SheetsMessages } from '../../app/Containers/Spreadsheet/messages/SheetsMessages'
import { loadDemoMessageFactory } from './demoMessages'
import { useDemoLocalization } from './useDemoLocalization'

jest.mock('./demoMessages', () => ({ loadDemoMessageFactory: jest.fn() }))

const mockedLoadDemoMessageFactory = jest.mocked(loadDemoMessageFactory)

function deferredMessages() {
  let resolve!: (messages: SheetsMessages) => void
  let reject!: (error: Error) => void
  const activate = jest.fn((messages: SheetsMessages) => messages)
  const promise = new Promise<() => SheetsMessages>((resolvePromise, rejectPromise) => {
    resolve = (messages) => resolvePromise(() => activate(messages))
    reject = rejectPromise
  })
  return { promise, resolve, reject, activate }
}

function messages(file: string): SheetsMessages {
  const base = createSheetsMessages()
  return { ...base, menus: { ...base.menus, file } }
}

afterEach(() => mockedLoadDemoMessageFactory.mockReset())

test('keeps the newest language when an older request finishes later', async () => {
  const french = deferredMessages()
  const german = deferredMessages()
  mockedLoadDemoMessageFactory.mockReturnValueOnce(french.promise).mockReturnValueOnce(german.promise)
  const { result } = renderHook(() => useDemoLocalization())
  let first!: Promise<void>
  let second!: Promise<void>
  act(() => {
    first = result.current.changeLanguage('fr-FR')
    second = result.current.changeLanguage('de-DE')
  })
  await act(async () => {
    german.resolve(messages('Datei'))
    await second
  })
  await act(async () => {
    french.resolve(messages('Fichier'))
    await first
  })
  expect(french.activate).not.toHaveBeenCalled()
  expect(german.activate).toHaveBeenCalledTimes(1)
  expect(result.current.uiLocale).toBe('de-DE')
  expect(result.current.messages?.menus.file).toBe('Datei')
})

test('does not activate a pending translation after returning to English', async () => {
  const french = deferredMessages()
  mockedLoadDemoMessageFactory.mockReturnValueOnce(french.promise)
  const { result } = renderHook(() => useDemoLocalization())
  let pending!: Promise<void>
  act(() => {
    pending = result.current.changeLanguage('fr-FR')
  })
  await act(async () => {
    await result.current.changeLanguage('en-US')
  })
  await act(async () => {
    french.resolve(messages('Fichier'))
    await pending
  })
  expect(french.activate).not.toHaveBeenCalled()
  expect(result.current.uiLocale).toBe('en-US')
  expect(result.current.messages).toBeUndefined()
})

test('retains the active language after a loading failure', async () => {
  const french = deferredMessages()
  const german = deferredMessages()
  mockedLoadDemoMessageFactory.mockReturnValueOnce(french.promise).mockReturnValueOnce(german.promise)
  const { result } = renderHook(() => useDemoLocalization())
  let first!: Promise<void>
  act(() => {
    first = result.current.changeLanguage('fr-FR')
  })
  await act(async () => {
    french.resolve(messages('Fichier'))
    await first
  })
  const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {})
  try {
    let second!: Promise<void>
    act(() => {
      second = result.current.changeLanguage('de-DE')
    })
    await act(async () => {
      german.reject(new Error('catalog unavailable'))
      await second
    })
    expect(result.current.uiLocale).toBe('fr-FR')
    expect(result.current.messages?.menus.file).toBe('Fichier')
    expect(result.current.languageStatus).toContain('Previous language retained')
  } finally {
    errorLog.mockRestore()
  }
})
