import { useConfig } from '@proton/app-context/useConfig'
import Logo from '@proton/components/components/logo/Logo'
import AppsDropdown from '@proton/components/containers/app/AppsDropdown'
import UserDropdown from '@proton/components/containers/heading/UserDropdown'
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint'
import { IcLockFilled } from '@proton/icons/icons/IcLockFilled'
import { APPS } from '@proton/shared/lib/constants'
import { c } from 'ttag'

import { getDocsReportContextLines } from '~/utils/report-context'
import { getWindowLocationExcludingDomain } from '../__utils/getWindowLocationExcludingDomain'

// Copied from `DocsHeaderNoDocument` in `~/components/document/DocumentLayout/DocumentHeader/DocumentHeader.tsx`, which
// imports docs-core.
/** The header when there is no document to show: the logo, the app switcher and the user menu. */
export function ErrorHeader() {
  const { viewportWidth } = useActiveBreakpoint()
  const { APP_VERSION, CLIENT_TYPE } = useConfig()

  return (
    <div
      className="error-header flex flex-nowrap items-center justify-between gap-2 bg-signalInfoMinorCustom px-10 pt-5"
      data-testid="error-header"
    >
      <div className="flex flex-shrink-0 flex-nowrap items-center gap-2">
        <Logo variant={viewportWidth['<=small'] ? 'glyph-only' : 'with-wordmark'} appName={APPS.PROTONDOCS} />
        <AppsDropdown />
      </div>
      <div className="hidden items-center justify-center text-center md:flex">
        <IcLockFilled className="mr-1.5" />
        <span className="pt-0.5 text-sm">{c('Title').t`End-to-end encrypted`}</span>
      </div>
      <div className="no-doc-header">
        <UserDropdown
          app={APPS.PROTONDOCS}
          reportDescriptionContext={getDocsReportContextLines({ appVersion: APP_VERSION, clientType: CLIENT_TYPE })}
          sessionOptions={{ path: getWindowLocationExcludingDomain(), target: '_self' }}
        />
      </div>
    </div>
  )
}
