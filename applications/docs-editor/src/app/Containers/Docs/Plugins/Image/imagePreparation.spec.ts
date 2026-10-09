import { isImage, isSupportedImage, prepareImageSource, shouldConvertToWebP } from './imagePreparation'

const safari13 =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Safari/605.1.15'
const safari14 =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15'
const safari17 =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
const mobileSafari17 =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const windowsSafari17 =
  'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/534.57.2 (KHTML, like Gecko) Version/17.0 Safari/534.57.2'
const chromeOnMac =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

it('keeps the host image MIME and browser compatibility policy', () => {
  expect(isImage('image/jpeg')).toBe(true)
  expect(isImage('application/pdf')).toBe(false)
  expect(isSupportedImage('image/jpg', safari13)).toBe(true)
  expect(isSupportedImage('image/webp', safari13)).toBe(false)
  expect(isSupportedImage('image/webp', safari14)).toBe(true)
  expect(isSupportedImage('image/heic', safari14)).toBe(false)
  expect(isSupportedImage('image/heic', safari17)).toBe(true)
  expect(isSupportedImage('image/jxl', safari17)).toBe(true)
  expect(isSupportedImage('image/heic', mobileSafari17)).toBe(true)
  expect(isSupportedImage('image/jxl', mobileSafari17)).toBe(true)
  expect(isSupportedImage('image/heic', windowsSafari17)).toBe(false)
  expect(isSupportedImage('image/jxl', chromeOnMac)).toBe(false)
  expect(isSupportedImage('image/avif', chromeOnMac)).toBe(true)
})

it('only converts large images or AVIF/HEIC/JXL to WebP', () => {
  expect(shouldConvertToWebP({ type: 'image/png', size: 500 * 1024 })).toBe(false)
  expect(shouldConvertToWebP({ type: 'image/png', size: 500 * 1024 + 1 })).toBe(true)
  expect(shouldConvertToWebP({ type: 'image/avif', size: 1 })).toBe(true)
  expect(shouldConvertToWebP({ type: 'image/heic', size: 1 })).toBe(true)
  expect(shouldConvertToWebP({ type: 'image/jxl', size: 1 })).toBe(true)
})

it('keeps a small inserted image as its original data URL', async () => {
  const image = new Blob(['image'], { type: 'image/png' })
  expect(await prepareImageSource(image)).toBe('data:image/png;base64,aW1hZ2U=')
})

it('renders AVIF through a WebP canvas even below the size limit', async () => {
  const originalImage = Object.getOwnPropertyDescriptor(globalThis, 'Image')
  class LoadedImage {
    width = 100
    height = 50
    onload: (() => void) | null = null
    crossOrigin = ''
    referrerPolicy = ''
    private url = ''

    set src(value: string) {
      this.url = value
      this.onload?.()
    }

    get src() {
      return this.url
    }
  }
  Object.defineProperty(globalThis, 'Image', { configurable: true, value: LoadedImage })
  const drawImage = jest.fn()
  const getContext = jest
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D)
  const toDataURL = jest.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/webp;base64,YQ==')

  try {
    expect(await prepareImageSource(new Blob(['image'], { type: 'image/avif' }))).toBe('data:image/webp;base64,YQ==')
    expect(toDataURL).toHaveBeenCalledWith('image/webp', 1)
    expect(drawImage).toHaveBeenCalled()
  } finally {
    getContext.mockRestore()
    toDataURL.mockRestore()
    if (originalImage) {
      Object.defineProperty(globalThis, 'Image', originalImage)
    }
  }
})
