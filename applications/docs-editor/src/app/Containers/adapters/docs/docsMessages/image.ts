import { c } from 'ttag'
import type { DocsMessages } from '../../../Docs/public'

export function createImageMessages(): Pick<DocsMessages, 'image'> {
  return {
    image: {
      loading: c('Info').t`Loading`,
      remoteImageBlocked: c('Info').t`Remote image blocked`,
      remoteImageDownloadHint: c('Info')
        .t`Open the link to download the image, then use "Insert image" to add it to this document.`,
      remoteImagePasteNotSupported: c('Warning')
        .t`Pasting remote images is not supported. Download the image and use "Insert image" instead.`,
    },
  }
}
