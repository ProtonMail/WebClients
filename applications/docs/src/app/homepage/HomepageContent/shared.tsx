import type { ProtonDocumentType } from '../utils/mimetype'
import { clsx } from '../utils/clsx'
import type { IconData } from '../components/Icon'
import * as Icons from '../components/icons'
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
  document: Icons.brandProtonDocs,
  spreadsheet: Icons.brandProtonSheets,
} satisfies Record<ProtonDocumentType, IconData>

export const COLOR_BY_TYPE = {
  document: '#4695F3',
  spreadsheet: '#21B263',
}
