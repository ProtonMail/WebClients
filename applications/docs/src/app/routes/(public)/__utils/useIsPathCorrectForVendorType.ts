import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom-v5-compat'

import type { DocumentType } from '@proton/docs-shared'
import { HandshakeInfoVendorType } from '@proton/shared/lib/interfaces/drive/sharing'

import { replaceLastPathSegment } from '~/utils/docs-url-bar'

/** `ProtonSheet` is not a member of the enum yet */
const PROTON_SHEET_VENDOR_TYPE = 2 as HandshakeInfoVendorType

/**
 * Public links may name no document type (`/?mode=open-url…`) or the wrong one. The type is known from the
 * handshake before any password is entered, so the path is corrected here, before the document mounts.
 * Correcting it after loading would need a reload, which discards the custom password and asks for it again.
 *
 * Once the content has rendered the path is no longer checked, so going back in history can't unmount it.
 */
export function useIsPathCorrectForVendorType(
  vendorType: HandshakeInfoVendorType | undefined,
  hasRenderedContent: boolean,
) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const documentType = getDocumentTypeFromVendorType(vendorType)
  const isPathCorrect =
    hasRenderedContent || !documentType || replaceLastPathSegment(pathname, documentType) === pathname

  useEffect(() => {
    if (isPathCorrect || !documentType) {
      return
    }
    // The hash holds the url password and may have been restored outside the router, so read it from window
    const { pathname: currentPathname, search, hash } = window.location
    navigate({ pathname: replaceLastPathSegment(currentPathname, documentType), search, hash }, { replace: true })
  }, [isPathCorrect, documentType, navigate])

  return isPathCorrect
}

function getDocumentTypeFromVendorType(vendorType: HandshakeInfoVendorType | undefined): DocumentType | undefined {
  switch (vendorType) {
    case HandshakeInfoVendorType.ProtonDoc:
      return 'doc'
    case PROTON_SHEET_VENDOR_TYPE:
      return 'sheet'
    default:
      return undefined
  }
}
