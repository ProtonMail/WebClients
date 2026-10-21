import type { MimeName } from '@proton/components/components/icon/MimeIcon'
import type { ProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'
import clsx from '@proton/utils/clsx'
import type { IconComponent } from '@proton/icons/component'
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
  document: 'proton-doc',
  spreadsheet: 'proton-sheet',
} satisfies Record<ProtonDocumentType, MimeName>

export const COLOR_BY_TYPE = {
  document: '#4695F3',
  spreadsheet: '#21B263',
}
