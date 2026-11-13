import { toBase64 } from '@proton/shared/lib/helpers/file'
import { forgeImageURL } from '@proton/shared/lib/helpers/image'

export type ImageProxyParams = { apiUrl: string; uid: string }

/**
 * Adapted from `packages/docs-core/lib/Api/DocsApi.ts`, its `fetchExternalImageAsBase64`, which doc2 must not import:
 * an external image the editor exports, fetched through the image proxy as a data URL, or undefined when it isn't an
 * image or can't be fetched, so the export leaves it out.
 */
export async function fetchExternalImageAsBase64(
  url: string,
  { apiUrl, uid }: ImageProxyParams,
): Promise<string | undefined> {
  try {
    const response = await fetch(forgeImageURL({ url, origin: window.location.origin, apiUrl, uid }))
    const blob = await response.blob()
    if (!blob.type.startsWith('image/')) {
      return undefined
    }
    return await toBase64(blob)
  } catch {
    return undefined
  }
}
