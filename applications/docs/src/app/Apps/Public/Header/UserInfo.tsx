import { Button } from '@proton/atoms/index'
import { getInitials } from '@proton/shared/lib/helpers/string'
import type { UserModel } from '@proton/shared/lib/interfaces'

import './UserInfo.scss'
import { useDocsPublicToken } from '@proton/drive-store/hooks/drive/useDocsPublicToken'
import { redirectToAccountSwitcher } from '../Utils/Redirection'

export interface Props {
  user: UserModel
}

// This is a partial copy of UserDropdownButton.
// We use this Component to show basic user info without the dropdown
export const UserInfo = ({ user }: Props) => {
  const { Email, DisplayName, Name } = user || {}
  const nameToDisplay = DisplayName || Name || '' // nameToDisplay can be falsy for external account
  const initials = getInitials(nameToDisplay || Email || '')
  const { token, urlPassword, linkId } = useDocsPublicToken()

  return (
    <Button
      onClick={() => {
        redirectToAccountSwitcher(token, linkId, urlPassword)
      }}
      className="user-info user-info interactive-pseudo-protrude interactive--no-background relative ml-0 flex flex-nowrap items-center rounded border-none p-0"
    >
      <span
        className="user-initials relative my-auto inline-block flex shrink-0 rounded border p-1 text-sm"
        aria-hidden="true"
      >
        <span className="m-auto">{initials}</span>
      </span>
    </Button>
  )
}
