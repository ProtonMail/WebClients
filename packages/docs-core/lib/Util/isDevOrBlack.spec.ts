import { isLocalEnvironment, isDevOrBlack } from './isDevOrBlack'

describe('isDevOrBlack', () => {
  // @ts-ignore
  delete window.location
  // @ts-ignore
  window.location = { host: '' }

  it('isDev() should return true for local', () => {
    window.location.host = 'proton.local'
    expect(isLocalEnvironment()).toBe(true)

    window.location.host = 'proton.local:3000'
    expect(isLocalEnvironment()).toBe(true)

    window.location.host = 'proton.me'
    expect(isLocalEnvironment()).toBe(false)
  })

  it('isDevOrBlack() should return true for local and proton.black', () => {
    window.location.host = 'proton.local'
    expect(isDevOrBlack()).toBe(true)

    window.location.host = 'proton.local:3000'
    expect(isDevOrBlack()).toBe(true)

    window.location.host = 'proton.black'
    expect(isDevOrBlack()).toBe(true)

    window.location.host = 'proton.me'
    expect(isDevOrBlack()).toBe(false)
  })
})
