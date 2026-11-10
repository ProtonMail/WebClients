import { IcBrandProtonDocs } from '@proton/icons/icons/IcBrandProtonDocs'
import { IcBrandProtonSheets } from '@proton/icons/icons/IcBrandProtonSheets'
import useAuthentication from '@proton/components/hooks/useAuthentication'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import { Menu, MenuItem } from '@proton/docs-shared/components/ui/ui'
import { c } from 'ttag'
import { COLOR_BY_TYPE, REFRESH_AFTER_NEW_DOCUMENT } from './shared'
import { useHomepageView } from '../homepageViewContext'
import { useIsSheetsEnabled } from '~/utils/flags'
import clsx from '@proton/utils/clsx'
import type * as Ariakit from '@ariakit/react'
import { TelemetryEvent } from '../utils/telemetry'

interface Props extends Ariakit.MenuProps {}

export function NewDocumentMenu({ className, ...rest }: Props) {
  const { getLocalID } = useAuthentication()
  const { updateRecentDocuments, reportTelemetry } = useHomepageView()
  const isSheetsEnabled = useIsSheetsEnabled()
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
        render={<a href={getAppHref('/doc', APPS.PROTONDOCS, getLocalID())} target="_blank" />}
        onClick={() => {
          reportTelemetry(TelemetryEvent.document_created)
          setTimeout(updateRecentDocuments, REFRESH_AFTER_NEW_DOCUMENT)
        }}
      >
        {c('Action').t`New document`}
      </MenuItem>
      {isSheetsEnabled && (
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
          render={<a href={getAppHref('/sheet', APPS.PROTONDOCS, getLocalID())} target="_blank" />}
          onClick={() => setTimeout(updateRecentDocuments, REFRESH_AFTER_NEW_DOCUMENT)}
        >
          {c('sheets_2025:Action').t`New spreadsheet`}
        </MenuItem>
      )}
    </Menu>
  )
}
