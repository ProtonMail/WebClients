import { APPS } from '../utils/apps'
import { Menu, MenuItem } from './menu'
import { useHomepageMessages } from '../messages/HomepageMessagesProvider'
import { COLOR_BY_TYPE, REFRESH_AFTER_NEW_DOCUMENT } from './shared'
import { useHomepageView } from '../homepageViewContext'
import { clsx } from '../utils/clsx'
import type * as Ariakit from '@ariakit/react'
import { TelemetryEvent } from '../utils/telemetry'
import { Icon } from '../components/Icon'
import * as Icons from '../components/icons'

interface Props extends Ariakit.MenuProps {}

export function NewDocumentMenu({ className, ...rest }: Props) {
  const { updateRecentDocuments, reportTelemetry, getAppHref } = useHomepageView()
  const messages = useHomepageMessages().newDocument
  return (
    <Menu className={clsx('[&_a]:hover:text-[--text-norm]', className)} {...rest}>
      <MenuItem
        className="no-underline"
        leadingIconSlot={
          <Icon
            data={Icons.brandProtonDocs}
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
        {messages.document}
      </MenuItem>
      <MenuItem
        className="no-underline"
        leadingIconSlot={
          <Icon
            data={Icons.brandProtonSheets}
            size={5}
            className="shrink-0 text-[--icon-color]"
            style={{ '--icon-color': COLOR_BY_TYPE.spreadsheet }}
          />
        }
        // eslint-disable-next-line jsx-a11y/control-has-associated-label, jsx-a11y/anchor-has-content
        render={<a href={getAppHref('/sheet', APPS.PROTONDOCS)} target="_blank" />}
        onClick={() => setTimeout(updateRecentDocuments, REFRESH_AFTER_NEW_DOCUMENT)}
      >
        {messages.spreadsheet}
      </MenuItem>
    </Menu>
  )
}
