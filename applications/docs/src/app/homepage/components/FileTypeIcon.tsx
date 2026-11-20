// The Proton Docs and Sheets file icons, copied from `@proton/file-icons` (`MimeProtonDoc`, `MimeProtonSheet`).
// They have their own colours, so they aren't plain `IconData`: their gradient needs an id unique to each rendered icon.
// Only the 16×16 drawing is kept (the homepage shows them at size 4); `@proton/file-icons` switches to 24×24 and
// 48×48 drawings from sizes 5 and 10 up. Its no-op full-size mask and clip path are left out.

import { useId } from 'react'
import type { ProtonDocumentType } from '../utils/mimetype'
import { Icon, type IconData, type IconProps } from './Icon'

const fileTypeIconData = {
  document: (gradientId: string) => (
    <>
      <path
        fill={`url(#${gradientId})`}
        d="M13.333 0H2.667A2.667 2.667 0 0 0 0 2.667v10.666A2.667 2.667 0 0 0 2.667 16h10.666A2.667 2.667 0 0 0 16 13.333V2.667A2.667 2.667 0 0 0 13.333 0Z"
      ></path>
      <path fill="#85D4F5" d="M12 0H8v4h4V0Z"></path>
      <path fill="#D6F1FC" d="M12 0h1.333A2.667 2.667 0 0 1 16 2.667V4h-4V0Z"></path>
      <path fill="#85D4F5" d="M16 4h-4v4h4V4Z"></path>
      <path
        fill="#fff"
        fillRule="evenodd"
        d="M8.667 12.667a.667.667 0 0 1-.667.666H3.333a.667.667 0 1 1 0-1.333H8c.368 0 .667.299.667.667ZM6.667 10a.667.667 0 0 1-.667.667H3.333a.667.667 0 0 1 0-1.334H6c.368 0 .667.299.667.667Z"
        clipRule="evenodd"
      ></path>
      <radialGradient
        id={gradientId}
        cx="0"
        cy="0"
        r="1"
        gradientTransform="rotate(-53.15 18.634 10.704) scale(18.8804)"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#6D4AFF"></stop>
        <stop offset="1" stopColor="#34B8EE"></stop>
      </radialGradient>
    </>
  ),
  spreadsheet: (gradientId: string) => (
    <>
      <path
        fill={`url(#${gradientId})`}
        d="M0 2.667A2.667 2.667 0 0 1 2.667 0h10.666A2.667 2.667 0 0 1 16 2.667v10.666A2.667 2.667 0 0 1 13.333 16H2.667A2.667 2.667 0 0 1 0 13.333V2.667Z"
      ></path>
      <path
        fill="#fff"
        d="M5.216 6.272c.371 0 .672.301.672.672v3.04h3.424a.673.673 0 1 1 0 1.344H5.888v1.312a.672.672 0 1 1-1.344 0v-1.312H2.976a.672.672 0 0 1 0-1.344h1.568v-3.04c0-.37.3-.671.672-.672Z"
      ></path>
      <path fill="#fff" fillOpacity=".5" d="M8 0h4v4H8V0Z"></path>
      <path fill="#fff" fillOpacity=".8" d="M12 0h1.333A2.667 2.667 0 0 1 16 2.667V4h-4V0Z"></path>
      <path fill="#fff" fillOpacity=".5" d="M12 4h4v4h-4V4Z"></path>
      <radialGradient
        id={gradientId}
        cx="0"
        cy="0"
        r="1"
        gradientTransform="rotate(-53.15 18.634 10.704) scale(18.8804)"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#1B854C"></stop>
        <stop offset="1" stopColor="#26DA79"></stop>
      </radialGradient>
    </>
  ),
} satisfies Record<ProtonDocumentType, (gradientId: string) => IconData>

export interface FileTypeIconProps extends Omit<IconProps, 'data'> {
  type: ProtonDocumentType
}

export function FileTypeIcon({ type, ...props }: FileTypeIconProps) {
  // React's ids contain colons, which break `url(#…)` references.
  const gradientId = `file-type-icon-gradient-${useId().replace(/:/g, '')}`
  return <Icon data={fileTypeIconData[type](gradientId)} {...props} />
}
