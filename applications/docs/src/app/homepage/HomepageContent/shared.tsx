import type { ProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'
import clsx from '@proton/utils/clsx'
import type { IconComponent } from '@proton/icons/component'
import type { MimeIconComponent } from '@proton/file-icons/component'
import { MimeProtonDoc } from '@proton/file-icons/icons/MimeProtonDoc'
import { MimeProtonSheet } from '@proton/file-icons/icons/MimeProtonSheet'
import { IcBrandProtonDocs } from '@proton/icons/icons/IcBrandProtonDocs'
import { IcBrandProtonSheets } from '@proton/icons/icons/IcBrandProtonSheets'
import type { ComponentPropsWithoutRef } from 'react'

export type ContentSheetProps = ComponentPropsWithoutRef<'div'> & {
  isBottom?: boolean
}

export function ContentSheet({ isBottom, ...props }: ContentSheetProps) {
  return (
    <div
      {...props}
      className={clsx(
        'bg-norm border-weak rounded-lg border',
        isBottom && '!rounded-b-none !border-b-0',
        props.className,
      )}
    />
  )
}

export const REFRESH_AFTER_NEW_DOCUMENT = 5000 // ms

export const ICON_BY_TYPE = {
  document: IcBrandProtonDocs,
  spreadsheet: IcBrandProtonSheets,
} satisfies Record<ProtonDocumentType, IconComponent>

export const MIME_ICON_BY_TYPE = {
  document: MimeProtonDoc,
  spreadsheet: MimeProtonSheet,
} satisfies Record<ProtonDocumentType, MimeIconComponent>

export const COLOR_BY_TYPE = {
  document: '#4695F3',
  spreadsheet: '#21B263',
}
