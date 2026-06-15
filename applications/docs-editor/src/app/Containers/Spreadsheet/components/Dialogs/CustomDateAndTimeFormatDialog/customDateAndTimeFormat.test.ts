import { parsePattern, stripUnsupportedDirectives } from './customDateAndTimeFormat'

const token = (type: string, code: string) => ({ kind: 'token', pointer: { type, code } })
const literal = (text: string) => ({ kind: 'literal', text })

describe('parsePattern', () => {
  it('returns no segments for an empty pattern', () => {
    expect(parsePattern('')).toEqual([])
  })

  describe('month vs minute disambiguation', () => {
    it('reads a lone m/mm as month', () => {
      expect(parsePattern('m')).toEqual([token('month', 'm')])
      expect(parsePattern('mm')).toEqual([token('month', 'mm')])
    })

    it('reads m/mm as month when surrounded by date tokens', () => {
      expect(parsePattern('m/d')).toEqual([token('month', 'm'), literal('/'), token('day', 'd')])
    })

    it('reads m/mm as minute when preceded by an hour token', () => {
      expect(parsePattern('h:mm')).toEqual([token('hour', 'h'), literal(':'), token('minute', 'mm')])
    })

    it('reads m/mm as minute when followed by a second token', () => {
      expect(parsePattern('mm:ss')).toEqual([token('minute', 'mm'), literal(':'), token('second', 'ss')])
    })

    it('disambiguates both month and minute within one pattern', () => {
      expect(parsePattern('m/d hh:mm')).toEqual([
        token('month', 'm'),
        literal('/'),
        token('day', 'd'),
        literal(' '),
        token('hour', 'hh'),
        literal(':'),
        token('minute', 'mm'),
      ])
    })

    it('treats mmm and longer runs as month unconditionally (never minute)', () => {
      expect(parsePattern('h:mmm')).toEqual([token('hour', 'h'), literal(':'), token('month', 'mmm')])
    })
  })

  describe('quoted and escaped literals', () => {
    it('strips quotes and merges surrounding spaces into one literal', () => {
      expect(parsePattern('dddd "at" h')).toEqual([token('day', 'dddd'), literal(' at '), token('hour', 'h')])
    })

    it('treats a backslash-escaped character as a literal', () => {
      expect(parsePattern('\\d')).toEqual([literal('d')])
      expect(parsePattern('d\\d')).toEqual([token('day', 'd'), literal('d')])
    })

    it('consumes an unterminated quote to the end of the pattern', () => {
      expect(parsePattern('dddd "at')).toEqual([token('day', 'dddd'), literal(' at')])
    })
  })

  describe('elapsed (bracketed) tokens', () => {
    it('parses elapsed hour/minute/second codes', () => {
      expect(parsePattern('[h]')).toEqual([token('elapsed-hour', '[h]')])
      expect(parsePattern('[mm]')).toEqual([token('elapsed-minute', '[mm]')])
      expect(parsePattern('[ss]')).toEqual([token('elapsed-second', '[ss]')])
    })

    it('falls back to a literal for an unrecognized bracketed group', () => {
      expect(parsePattern('[xyz]')).toEqual([literal('[xyz]')])
    })
  })

  describe('AM/PM', () => {
    it('parses the AM/PM marker as an ampm token', () => {
      expect(parsePattern('h:mm AM/PM')).toEqual([
        token('hour', 'h'),
        literal(':'),
        token('minute', 'mm'),
        literal(' '),
        token('ampm', 'AM/PM'),
      ])
    })

    it('treats the unsupported shortened markers as literal text', () => {
      expect(parsePattern('a/p')).toEqual([literal('a/p')])
      expect(parsePattern('A/P')).toEqual([literal('A/P')])
    })
  })

  describe('milliseconds', () => {
    it('parses a dot-zeros run following a seconds token', () => {
      expect(parsePattern('ss.000')).toEqual([token('second', 'ss'), token('millisecond', '.000')])
    })

    it('keeps a dot that is not followed by a zero as a literal', () => {
      expect(parsePattern('d.m')).toEqual([token('day', 'd'), literal('.'), token('month', 'm')])
    })
  })

  describe('letter runs', () => {
    it('treats a run longer than any known code as a literal', () => {
      expect(parsePattern('ddddd')).toEqual([literal('ddddd')])
      expect(parsePattern('yyy')).toEqual([literal('yyy')])
    })

    it('matches case-insensitively', () => {
      expect(parsePattern('DDDD')).toEqual([token('day', 'dddd')])
    })
  })

  describe('literal merging', () => {
    it('merges consecutive literal characters into a single segment', () => {
      expect(parsePattern('--//')).toEqual([literal('--//')])
    })

    it('keeps literals between tokens separate from the tokens', () => {
      expect(parsePattern('d-d')).toEqual([token('day', 'd'), literal('-'), token('day', 'd')])
    })
  })

  it('parses a full date-and-time pattern', () => {
    expect(parsePattern('dddd, mmmm d, yyyy "at" h:mm:ss AM/PM')).toEqual([
      token('day', 'dddd'),
      literal(', '),
      token('month', 'mmmm'),
      literal(' '),
      token('day', 'd'),
      literal(', '),
      token('year', 'yyyy'),
      literal(' at '),
      token('hour', 'h'),
      literal(':'),
      token('minute', 'mm'),
      literal(':'),
      token('second', 'ss'),
      literal(' '),
      token('ampm', 'AM/PM'),
    ])
  })
})

describe('stripUnsupportedDirectives', () => {
  it('removes a leading locale/currency tag', () => {
    expect(stripUnsupportedDirectives('[$-en-us]m/d/yyyy hh:mm:ss')).toBe('m/d/yyyy hh:mm:ss')
  })

  it('removes a trailing text section', () => {
    expect(stripUnsupportedDirectives('h:mm AM/PM;@')).toBe('h:mm AM/PM')
  })

  it('removes both a leading tag and a trailing text section', () => {
    expect(stripUnsupportedDirectives('[$-en-US]m/d/yy h:mm AM/PM;@')).toBe('m/d/yy h:mm AM/PM')
  })

  it('leaves a plain pattern untouched', () => {
    expect(stripUnsupportedDirectives('dddd, mmmm d, yyyy')).toBe('dddd, mmmm d, yyyy')
  })

  it('does not strip a leading elapsed token', () => {
    expect(stripUnsupportedDirectives('[h]:mm:ss')).toBe('[h]:mm:ss')
  })
})
