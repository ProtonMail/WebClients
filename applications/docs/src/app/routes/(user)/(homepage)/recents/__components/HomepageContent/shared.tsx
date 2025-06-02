import type { MimeName } from '@proton/components/components/icon/MimeIcon'
import type { ProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'
import clsx from '@proton/utils/clsx'
import type { IconName } from 'packages/icons'
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

export const ICON_BY_TYPE = {
  document: 'brand-proton-docs',
  spreadsheet: 'brand-proton-sheets',
} satisfies Record<ProtonDocumentType, IconName>

export const MIME_ICON_BY_TYPE = {
  document: 'proton-doc',
  spreadsheet: 'proton-sheet',
} satisfies Record<ProtonDocumentType, MimeName>

export const COLOR_BY_TYPE = {
  document: '#4695F3',
  spreadsheet: '#21B263',
}
