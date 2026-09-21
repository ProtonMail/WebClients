import { getFontFamily, isFontLoaded, loadFont } from './font-state'

const fonts = {
  ready: Promise.resolve(),
  load: jest.fn().mockResolvedValue([]),
}

beforeAll(() => {
  Object.defineProperty(document, 'fonts', { configurable: true, value: fonts })
})

beforeEach(() => {
  fonts.load.mockReset().mockResolvedValue([])
})

describe('getFontFamily', () => {
  it('removes the font metadata suffix used by the spreadsheet library', () => {
    expect(getFontFamily('Roboto Serif:400,700')).toBe('Roboto Serif')
  })
})

describe('loadFont', () => {
  it('loads every supported face and dispatches the grid redraw event', async () => {
    const fontLoaded = jest.fn()
    document.addEventListener('fontloaded', fontLoaded)

    await loadFont('Roboto Serif:400,700')

    expect(fonts.load).toHaveBeenCalledWith('16px Roboto Serif')
    expect(fonts.load).toHaveBeenCalledWith('italic 16px Roboto Serif')
    expect(fonts.load).toHaveBeenCalledWith('bold 16px Roboto Serif')
    expect(fonts.load).toHaveBeenCalledWith('italic bold 16px Roboto Serif')
    expect(fontLoaded).toHaveBeenCalledTimes(1)
    expect(isFontLoaded('Roboto Serif')).toBe(true)

    document.removeEventListener('fontloaded', fontLoaded)
  })

  it('deduplicates concurrent and completed requests', async () => {
    await Promise.all([loadFont('Inconsolata:400'), loadFont('Inconsolata:400')])
    await loadFont('Inconsolata:400')

    expect(fonts.load).toHaveBeenCalledTimes(4)
  })

  it('leaves a failed font request retryable', async () => {
    fonts.load.mockRejectedValueOnce(new Error('Font unavailable'))

    await expect(loadFont('Lora')).rejects.toThrow('Font unavailable')
    expect(isFontLoaded('Lora')).toBe(false)

    await loadFont('Lora')
    expect(isFontLoaded('Lora')).toBe(true)
  })

  it('retries after the font stylesheet fails to load', async () => {
    let attempts = 0
    jest.resetModules()
    jest.doMock('./font-assets.css', () => {
      attempts++
      if (attempts === 1) {
        throw new Error('Chunk unavailable')
      }
      return {}
    })

    try {
      const isolatedFontState = await import('./font-state')

      await expect(isolatedFontState.loadFont('Calibri')).rejects.toThrow('Chunk unavailable')
      await isolatedFontState.loadFont('Calibri')

      expect(attempts).toBe(2)
      expect(isolatedFontState.isFontLoaded('Calibri')).toBe(true)
    } finally {
      jest.dontMock('./font-assets.css')
    }
  })
})
