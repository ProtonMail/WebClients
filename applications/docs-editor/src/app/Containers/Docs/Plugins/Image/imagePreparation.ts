import UAParser from 'ua-parser-js'

const MAX_IMAGE_SIZE = 500 * 1024

const mimeTypes = {
  apng: 'image/apng',
  avif: 'image/avif',
  bmp: 'image/bmp',
  gif: 'image/gif',
  heic: 'image/heic',
  ico: 'image/x-icon',
  jpg: 'image/jpeg',
  jxl: 'image/jxl',
  png: 'image/png',
  svg: 'image/svg+xml',
  vdnMicrosoftIcon: 'image/vnd.microsoft.icon',
  webp: 'image/webp',
} as const

const forcedWebPMimeTypes: ReadonlySet<string> = new Set([mimeTypes.avif, mimeTypes.heic, mimeTypes.jxl])

const isAtLeastSafari17 = (version: string) => {
  const major = Number(version.split('.')[0])
  return major === 17 || major > 17
}

export const isImage = (mimeType: string) => mimeType.startsWith('image/')

export const isSupportedImage = (mimeType: string, userAgent = navigator.userAgent) => {
  const { browser, os } = new UAParser(userAgent).getResult()
  const safariVersion = Number(browser.version?.split('.')[0])
  const supportsWebP = browser.name !== 'Safari' || safariVersion >= 14
  const supportsHEICAndJXL =
    ['mac os', 'ios'].includes((os.name || 'other').toLowerCase()) &&
    ['Safari', 'Mobile Safari'].includes(browser.name || '') &&
    Boolean(browser.version) &&
    isAtLeastSafari17(browser.version || '')

  return [
    mimeTypes.apng,
    mimeTypes.bmp,
    mimeTypes.gif,
    mimeTypes.ico,
    mimeTypes.vdnMicrosoftIcon,
    mimeTypes.jpg,
    'image/jpg', // Support wrongly labeled JPG files.
    mimeTypes.png,
    mimeTypes.svg,
    supportsWebP && mimeTypes.webp,
    mimeTypes.avif,
    supportsHEICAndJXL && mimeTypes.heic,
    supportsHEICAndJXL && mimeTypes.jxl,
  ]
    .filter(Boolean)
    .includes(mimeType)
}

export const shouldConvertToWebP = ({ type, size }: Pick<Blob, 'type' | 'size'>) =>
  forcedWebPMimeTypes.has(type) || size > MAX_IMAGE_SIZE

export const toBase64 = async (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = ({ target }) => {
      if (!target?.result) {
        reject(new Error('Invalid file'))
        return
      }
      resolve(target.result as string)
    }
    reader.onerror = reject
    reader.onabort = reject
    reader.readAsDataURL(blob)
  })

const toImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('url required'))
      return
    }
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.crossOrigin = 'anonymous'
    image.referrerPolicy = 'no-referrer'
    image.src = url
  })

const downSizeToWebP = async (source: string): Promise<string> => {
  const process = async (currentSource: string, maxWidth: number, maxHeight: number): Promise<string> => {
    const image = await toImage(currentSource)
    let { width, height } = image
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    const [widthRatio, heightRatio] = [maxWidth && width / maxWidth, maxHeight && height / maxHeight].map(Number)

    if (widthRatio >= heightRatio) {
      height /= widthRatio
      width = maxWidth
    } else {
      width /= heightRatio
      height = maxHeight
    }

    canvas.width = width
    canvas.height = height
    context?.drawImage(image, 0, 0, width, height)

    const resized = canvas.toDataURL(mimeTypes.webp, 1)
    if (new Blob([resized]).size <= MAX_IMAGE_SIZE) {
      return resized
    }
    return process(resized, Math.round(maxWidth * 0.9), Math.round(maxHeight * 0.9))
  }

  const { width, height } = await toImage(source)
  return process(source, width, height)
}

export const prepareImageSource = async (blob: Blob) => {
  const base64 = await toBase64(blob)
  return shouldConvertToWebP(blob) ? downSizeToWebP(base64) : base64
}
