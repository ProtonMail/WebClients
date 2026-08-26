import { isAllowedImageSrc, isBase64Image } from './ImageSrcUtils'

describe('ImageSrcUtils', () => {
  describe('isAllowedImageSrc', () => {
    it('allows embedded data URLs', () => {
      expect(isAllowedImageSrc('data:image/png;base64,abc')).toBe(true)
    })

    it('allows temporary blob URLs during editing', () => {
      expect(isAllowedImageSrc('blob:https://example.com/uuid')).toBe(true)
    })

    it('rejects remote http URLs', () => {
      expect(isAllowedImageSrc('http://example.com/image.png')).toBe(false)
    })

    it('rejects remote https URLs', () => {
      expect(isAllowedImageSrc('https://example.invalid/p.png?d=1')).toBe(false)
    })

    it('rejects file URLs', () => {
      expect(isAllowedImageSrc('file:///etc/passwd')).toBe(false)
    })

    it('rejects cid URLs', () => {
      expect(isAllowedImageSrc('cid:image001@example.com')).toBe(false)
    })
  })

  describe('isBase64Image', () => {
    it('identifies base64 image data URLs', () => {
      expect(isBase64Image('data:image/png;base64,abc')).toBe(true)
    })

    it('does not treat remote URLs as base64 images', () => {
      expect(isBase64Image('https://example.com/image.png')).toBe(false)
    })
  })
})
