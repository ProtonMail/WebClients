import { toImage } from '@proton/shared/lib/helpers/image'

function drawImageOnCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.drawImage(img, 0, 0)
  }
  return canvas
}

function canvasToJpeg(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/jpeg')
}

export async function convertWebpToJpeg(base64Webp: string): Promise<string> {
  const img = await toImage(base64Webp)

  const canvas = drawImageOnCanvas(img)
  const jpegBase64 = canvasToJpeg(canvas)

  return jpegBase64
}
