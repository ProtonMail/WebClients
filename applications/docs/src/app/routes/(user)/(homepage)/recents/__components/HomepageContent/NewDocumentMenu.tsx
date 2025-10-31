import { Icon, useAuthentication } from '@proton/components'
import { TelemetryDocsHomepageEvents } from '@proton/shared/lib/api/telemetry'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import { Menu, MenuItem } from '@proton/docs-shared/components/ui/ui'
import { c } from 'ttag'
import { ICON_BY_TYPE, COLOR_BY_TYPE } from './shared'
import { useApplication } from '~/utils/application-context'
import { useHomepageView } from '../../__utils/homepage-view'
import { useIsSheetsEnabled } from '~/utils/misc'
import clsx from '@proton/utils/clsx'
import type * as Ariakit from '@ariakit/react'

const REFRESH_AFTER_NEW_DOCUMENT = 10000 // ms

interface Props extends Ariakit.MenuProps {}

export function NewDocumentMenu({ className, ...rest }: Props) {
  const application = useApplication()
  const { getLocalID } = useAuthentication()
  const { updateRecentDocuments } = useHomepageView()
  const isSheetsEnabled = useIsSheetsEnabled()
  return (
    <Menu className={clsx('[&_a]:hover:text-[--text-norm]', className)} {...rest}>
      <MenuItem
        className="no-underline"
        leadingIconSlot={
          <Icon
            name={ICON_BY_TYPE.document}
            size={5}
            className="shrink-0 text-[--icon-color]"
            style={{ '--icon-color': COLOR_BY_TYPE.document }}
          />
        }
        // eslint-disable-next-line jsx-a11y/control-has-associated-label, jsx-a11y/anchor-has-content
        render={<a href={getAppHref('/doc', APPS.PROTONDOCS, getLocalID())} target="_blank" />}
        onClick={() => {
          application.metrics.reportHomepageTelemetry(TelemetryDocsHomepageEvents.document_created)
          setTimeout(updateRecentDocuments, REFRESH_AFTER_NEW_DOCUMENT)
        }}
      >
        {c('Action').t`New document`}
      </MenuItem>
      {isSheetsEnabled && (
        <MenuItem
          className="no-underline"
          leadingIconSlot={
            <Icon
              name={ICON_BY_TYPE.spreadsheet}
              size={5}
              className="shrink-0 text-[--icon-color]"
              style={{ '--icon-color': COLOR_BY_TYPE.spreadsheet }}
            />
          }
          // eslint-disable-next-line jsx-a11y/control-has-associated-label, jsx-a11y/anchor-has-content
          render={<a href={getAppHref('/sheet', APPS.PROTONDOCS, getLocalID())} target="_blank" />}
        >
          {c('sheets_2025:Action').t`New spreadsheet`}
        </MenuItem>
      )}
    </Menu>
  )
}
