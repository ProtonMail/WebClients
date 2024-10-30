import { c } from 'ttag'

import { Button } from '@proton/atoms'
import { Icon, Spotlight } from '@proton/components'
import { useSignupFlowModal } from '../SignupFlowModal/SignupFlowModal'
import { useDocsContext } from '../../../Containers/ContextProvider'
import { TooltipKey, useTooltipOnce } from '@proton/docs-shared'
import { RedirectAction } from '@proton/drive-store/store/_documents'

export interface Props {
  onClick: () => void
  urlPassword: string
}

export const MakeCopyButton = ({ urlPassword, onClick }: Props) => {
  const { surePublicContext } = useDocsContext()
  const { user } = surePublicContext

  const [signupFlowModal, showSignupFlowModal] = useSignupFlowModal()

  const { shouldShowTooltip } = useTooltipOnce(TooltipKey.PublicDocsMakeCopy)

  return (
    <>
      <Spotlight
        show={shouldShowTooltip}
        content={c('Spotlight').t`To edit this document, create a copy that you can modify.`}
        originalPlacement="bottom-end"
      >
        <Button
          color={user ? 'weak' : 'norm'}
          size="small"
          className="flex items-center gap-2 text-sm"
          data-testid="make-a-copy-button"
          onClick={() => {
            if (!user) {
              showSignupFlowModal({ urlPassword, redirectAction: RedirectAction.MakeCopy })
            } else {
              onClick()
            }
          }}
        >
          <Icon name="squares" />
          {c('Action').t`Create a copy`}
        </Button>
      </Spotlight>
      {signupFlowModal}
    </>
  )
}
