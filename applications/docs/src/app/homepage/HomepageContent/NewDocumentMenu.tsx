import { IcBrandProtonDocs } from '@proton/icons/icons/IcBrandProtonDocs'
import { IcBrandProtonSheets } from '@proton/icons/icons/IcBrandProtonSheets'
import { APPS } from '../utils/apps'
import { Menu, MenuItem } from './menu'
import { c } from 'ttag'
import { COLOR_BY_TYPE, REFRESH_AFTER_NEW_DOCUMENT } from './shared'
import { useHomepageView } from '../homepageViewContext'
import { clsx } from '../utils/clsx'
import type * as Ariakit from '@ariakit/react'
import { TelemetryEvent } from '../utils/telemetry'

interface Props extends Ariakit.MenuProps {}

export function NewDocumentMenu({ className, ...rest }: Props) {
  const { updateRecentDocuments, reportTelemetry, getAppHref } = useHomepageView()
  return (
    <Menu className={clsx('[&_a]:hover:text-[--text-norm]', className)} {...rest}>
      <MenuItem
        className="no-underline"
        leadingIconSlot={
          <IcBrandProtonDocs
            size={5}
            className="shrink-0 text-[--icon-color]"
            style={{ '--icon-color': COLOR_BY_TYPE.document }}
          />
        }
        // eslint-disable-next-line jsx-a11y/control-has-associated-label, jsx-a11y/anchor-has-content
        render={<a href={getAppHref('/doc', APPS.PROTONDOCS)} target="_blank" />}
        onClick={() => {
          reportTelemetry(TelemetryEvent.document_created)
          setTimeout(updateRecentDocuments, REFRESH_AFTER_NEW_DOCUMENT)
        }}
      >
        {c('Action').t`New document`}
      </MenuItem>
      <MenuItem
        className="no-underline"
        leadingIconSlot={
          <IcBrandProtonSheets
            size={5}
            className="shrink-0 text-[--icon-color]"
            style={{ '--icon-color': COLOR_BY_TYPE.spreadsheet }}
          />
        }
        // eslint-disable-next-line jsx-a11y/control-has-associated-label, jsx-a11y/anchor-has-content
        render={<a href={getAppHref('/sheet', APPS.PROTONDOCS)} target="_blank" />}
        onClick={() => setTimeout(updateRecentDocuments, REFRESH_AFTER_NEW_DOCUMENT)}
      >
        {c('sheets_2025:Action').t`New spreadsheet`}
      </MenuItem>
    </Menu>
  )
}
