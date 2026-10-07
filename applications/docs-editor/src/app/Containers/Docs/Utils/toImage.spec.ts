import { toImage } from './toImage'

describe('toImage', () => {
  let image: HTMLImageElement

  beforeEach(() => {
    image = document.createElement('img')
    jest.spyOn(window, 'Image').mockImplementation(() => image)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('resolves the loaded image with its dimensions and privacy attributes', async () => {
    image.width = 100
    image.height = 200
    const result = toImage('data:image/png;base64,base64')

    expect(image.src).toBe('data:image/png;base64,base64')
    expect(image.crossOrigin).toBe('anonymous')
    expect(image.referrerPolicy).toBe('no-referrer')

    image.dispatchEvent(new Event('load'))
    await expect(result).resolves.toBe(image)
    expect((await result).width).toBe(100)
    expect((await result).height).toBe(200)
  })

  it('rejects the image loading error', async () => {
    const result = toImage('data:image/png;base64,invalid')
    const error = new Event('error')

    image.dispatchEvent(error)

    await expect(result).rejects.toBe(error)
  })

  it('rejects an empty URL without creating an image', async () => {
    await expect(toImage('')).rejects.toThrow('url required')
    expect(Image).not.toHaveBeenCalled()
  })

  it('supports loading an image without the crossOrigin attribute', async () => {
    const result = toImage('data:image/png;base64,base64', false)

    expect(image.hasAttribute('crossorigin')).toBe(false)
    expect(image.referrerPolicy).toBe('no-referrer')

    image.dispatchEvent(new Event('load'))
    await expect(result).resolves.toBe(image)
  })
})
