/** Load an image without sending credentials or a referrer. */
export const toImage = (url: string, crossOrigin = true): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (!url) {
      return reject(new Error('url required'))
    }
    const image = new Image()
    image.onload = () => {
      resolve(image)
    }
    image.onerror = reject

    // Allow images to be used in a canvas when the source permits CORS.
    if (crossOrigin) {
      image.crossOrigin = 'anonymous'
    }
    image.referrerPolicy = 'no-referrer'
    image.src = url
  })
}
