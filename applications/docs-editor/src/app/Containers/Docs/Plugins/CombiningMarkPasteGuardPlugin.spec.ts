import { pasteExceedsDepth, exceedsDepthCheck } from './CombiningMarkPasteGuardPlugin'

const COMBINED_MARKS = '\u0301'

describe('exceedsDepthCheck', () => {
  it('allows plain ASCII text', () => {
    expect(exceedsDepthCheck('Hello, world!')).toBe(false)
  })

  it('blocks Zalgo-style combining mark sequences', () => {
    expect(exceedsDepthCheck('ą̴̵̷̸̛͟͝͞͠͡͏͘͜͢͟͞͠͡͏͘͜͢')).toBe(true)
  })

  it('allows Devanagari paragraphs with many combining marks', () => {
    const paragraph = 'श्री गणेशाय नमः। '.repeat(50)
    expect(exceedsDepthCheck(paragraph)).toBe(false)
  })

  it('allows Vietnamese paragraphs with many combining marks', () => {
    const paragraph = 'Việt Nam là một quốc gia ở Đông Nam Á. '.normalize('NFD').repeat(50)
    expect(exceedsDepthCheck(paragraph)).toBe(false)
  })

  it('allows up to 10 combining marks on a single base character', () => {
    expect(exceedsDepthCheck(`a${COMBINED_MARKS.repeat(10)}`)).toBe(false)
  })

  it('blocks more than 10 combining marks on a single base character', () => {
    expect(exceedsDepthCheck(`a${COMBINED_MARKS.repeat(11)}`)).toBe(true)
  })

  it('resets depth between base characters', () => {
    const text = `a${COMBINED_MARKS.repeat(5)}f${COMBINED_MARKS.repeat(5)}`
    expect(exceedsDepthCheck(text)).toBe(false)
  })

  it('blocks when any base character exceeds the depth limit', () => {
    const text = `normal${COMBINED_MARKS.repeat(3)}a${COMBINED_MARKS.repeat(11)}`
    expect(exceedsDepthCheck(text)).toBe(true)
  })
})

describe('pasteExceedsDepth', () => {
  it('allows paste when both flavors are clean', () => {
    const clipboardData = {
      getData: (type: string) => {
        if (type === 'Text') {
          return 'plain'
        }
        if (type === 'text/html') {
          return '<p>html</p>'
        }
        return ''
      },
    } as DataTransfer

    expect(pasteExceedsDepth(clipboardData)).toBe(false)
  })

  it('blocks when combining marks are present only in text/html', () => {
    const maliciousHtml = `<span>a${COMBINED_MARKS.repeat(11)}</span>`
    const clipboardData = {
      getData: (type: string) => {
        if (type === 'Text') {
          return ''
        }
        if (type === 'text/html') {
          return maliciousHtml
        }
        return ''
      },
    } as DataTransfer

    expect(pasteExceedsDepth(clipboardData)).toBe(true)
  })

  it('blocks when combining marks are present only in text/plain', () => {
    const maliciousText = `a${COMBINED_MARKS.repeat(11)}`
    const clipboardData = {
      getData: (type: string) => {
        if (type === 'Text') {
          return maliciousText
        }
        if (type === 'text/html') {
          return '<p>hello</p>'
        }
        return ''
      },
    } as DataTransfer

    expect(pasteExceedsDepth(clipboardData)).toBe(true)
  })

  it('blocks when combining marks are in text/html even if text/plain is benign', () => {
    const maliciousHtml = `<span>a${COMBINED_MARKS.repeat(11)}</span>`
    const clipboardData = {
      getData: (type: string) => {
        if (type === 'Text') {
          return 'hello'
        }
        if (type === 'text/html') {
          return maliciousHtml
        }
        return ''
      },
    } as DataTransfer

    expect(pasteExceedsDepth(clipboardData)).toBe(true)
  })
})
