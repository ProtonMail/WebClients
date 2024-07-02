import { ImageRun } from 'docx'
import { ImageNode } from '../../Plugins/Image/ImageNode'
import { toImage } from '@proton/shared/lib/helpers/image'
import { isBase64Image } from '@proton/shared/lib/helpers/validators'
import { DocxExportContext } from './Context'

export async function getImageRun(
  node: ImageNode,
  fetchExternalImageAsBase64: DocxExportContext['fetchExternalImageAsBase64'],
) {
  let src = node.getSrc()
  if (!isBase64Image(src)) {
    const fetched = await fetchExternalImageAsBase64(src)
    if (!fetched) {
      return null
    }
    src = fetched
  }
  let width = node.getWidth()
  let height = node.getHeight()
  if (width === 'inherit' || height === 'inherit') {
    const image = await toImage(src)
    width = width === 'inherit' ? image.width : width
    height = height === 'inherit' ? image.height : height
  }
  return new ImageRun({
    data: src,
    transformation: {
      width,
      height,
    },
  })
}
