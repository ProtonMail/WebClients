import { replaceUrl } from '@proton/shared/lib/helpers/browser'
import { PROTON_DOC_MIMETYPE, PROTON_SHEET_MIMETYPE } from '@proton/shared/lib/helpers/mimetype'
import type { DocsApi } from '../Api/DocsApi'

const MIME_TYPE_TO_PATHNAME_MAP: Record<string, string> = {
  [PROTON_DOC_MIMETYPE]: '/doc',
  [PROTON_SHEET_MIMETYPE]: '/sheet',
}

/**
 * If the current URL pathname does not match the mimetype of the document,
 * it will redirect to the correct pathname. For e.g., if you open a
 * spreadsheet with `/doc` instead of `/sheet`, this will redirect to
 * the same URL but with `/sheet`.
 */
export function redirectToCorrectDocTypeIfNeeded(mimeType: string, docsApi: DocsApi): boolean {
  const currentURL = new URL(location.href)
  const expectedPathname = MIME_TYPE_TO_PATHNAME_MAP[mimeType]
  if (currentURL.pathname.endsWith(expectedPathname)) {
    return false
  }
  currentURL.pathname = expectedPathname
  docsApi.resetInflightCount()
  replaceUrl(currentURL.toString())
  return true
}
