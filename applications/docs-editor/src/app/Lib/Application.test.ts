import { Application } from './Application'

describe('Application locale subscriptions', () => {
  it('immediately delivers the current locale, including one set before subscription', () => {
    const application = new Application()
    jest.spyOn(application.logger, 'info').mockImplementation(() => {})
    const onDefaultLocale = jest.fn()
    application.subscribeToLocale(onDefaultLocale)
    expect(onDefaultLocale).toHaveBeenCalledTimes(1)
    expect(onDefaultLocale).toHaveBeenCalledWith('en')

    application.setLocale('fr_FR')
    const onCurrentLocale = jest.fn()
    application.subscribeToLocale(onCurrentLocale)
    expect(onCurrentLocale).toHaveBeenCalledTimes(1)
    expect(onCurrentLocale).toHaveBeenCalledWith('fr')
  })

  it('delivers normalized locale updates while preserving the public field and logging', () => {
    const application = new Application()
    const log = jest.spyOn(application.logger, 'info').mockImplementation(() => {})
    const onLocale = jest.fn()
    application.subscribeToLocale(onLocale)
    onLocale.mockClear()

    application.setLocale('de_DE')
    expect(application.languageCode).toBe('de')
    application.setLocale('ja')
    expect(application.languageCode).toBe('ja')
    expect(onLocale.mock.calls).toEqual([['de'], ['ja']])
    expect(log).toHaveBeenNthCalledWith(1, 'Setting editor language code', 'de')
    expect(log).toHaveBeenNthCalledWith(2, 'Setting editor language code', 'ja')
  })

  it('stops delivering updates after cleanup, tolerates repeated cleanup, and retains other subscribers', () => {
    const application = new Application()
    jest.spyOn(application.logger, 'info').mockImplementation(() => {})
    const first = jest.fn()
    const second = jest.fn()
    const unsubscribeFirst = application.subscribeToLocale(first)
    const unsubscribeSecond = application.subscribeToLocale(second)
    application.setLocale('fr_FR')
    unsubscribeFirst()
    unsubscribeFirst()
    application.setLocale('de_DE')
    expect(first.mock.calls).toEqual([['en'], ['fr']])
    expect(second.mock.calls).toEqual([['en'], ['fr'], ['de']])

    unsubscribeSecond()
    application.setLocale('ja_JP')
    expect(second).toHaveBeenCalledTimes(3)
    expect(application.languageCode).toBe('ja')
  })
})
