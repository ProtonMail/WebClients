import { GetCommitDULimit } from './SquashingConstants'

describe('SquashingConstants', () => {
  const setHost = (hostname: string) => {
    Object.defineProperty(window, 'location', {
      value: {
        origin: `https://${hostname}`,
        hostname: hostname,
        host: hostname,
        protocol: 'https:',
        port: '',
      },
      writable: true,
    })
  }

  it('should return 100 if local or black', () => {
    setHost('docs.proton.dev')

    expect(GetCommitDULimit()).toBe(100)

    setHost('docs.darwin.proton.black')

    expect(GetCommitDULimit()).toBe(100)
  })

  it('should return prod value', () => {
    setHost('docs.proton.me')

    expect(GetCommitDULimit()).toBe(500)
  })
})
