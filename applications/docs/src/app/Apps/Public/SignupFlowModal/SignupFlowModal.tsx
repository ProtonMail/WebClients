import { useEffect, useState } from 'react'

import { c } from 'ttag'

import { Button } from '@proton/atoms'
import type { ModalStateProps } from '@proton/components'
import {
  DriveLogo,
  Form,
  Icon,
  InputFieldTwo,
  ModalTwo,
  ModalTwoContent,
  ModalTwoFooter,
  ModalTwoHeader,
  useApi,
  useModalTwoStatic,
} from '@proton/components'
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper'
import { queryCheckEmailAvailability } from '@proton/shared/lib/api/user'
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants'
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors'
import { emailValidator } from '@proton/shared/lib/helpers/formValidators'

import { useDocsPublicToken } from '@proton/drive-store/hooks/drive/useDocsPublicToken'
import { Actions, countActionWithTelemetry } from '@proton/drive-store/utils/telemetry'
import { openNewTabToSignIn } from '../Utils/Redirection'
import { openNewTabToSignUp } from '../Utils/Redirection'
import { RedirectAction } from '@proton/drive-store/store/_documents'

export interface Props {
  urlPassword: string
  redirectAction: RedirectAction
}

export const SignupFlowModal = ({ urlPassword, onClose, redirectAction, ...modalProps }: Props & ModalStateProps) => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const api = useApi()
  const { token, linkId } = useDocsPublicToken()

  useEffect(() => {
    countActionWithTelemetry(Actions.ViewSignUpFlowModal)
  }, [])

  const handleChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setError(emailValidator(e.target.value))
  }

  /*
   * Sign-up flow: Redirect to /shared-with-me, then auto-add bookmarks in MainContainer.tsx
   * Sign-in flow: Auto-add bookmarks in MainContainer.tsx and redirect back to public page
   */
  const handleSubmit = async () => {
    try {
      countActionWithTelemetry(Actions.SubmitSignUpFlowModal)
      const { Code } = await api({
        ...queryCheckEmailAvailability(email),
        silence: [API_CUSTOM_ERROR_CODES.ALREADY_USED],
      })
      // Email is verified and available to use
      // We redirect to DRIVE_SIGNUP
      if (Code === 1000) {
        await openNewTabToSignUp({ action: redirectAction, token, email, linkId, urlPassword })
      }
    } catch (err) {
      const { code, message } = getApiError(err)
      // Email is already in use, we redirect to SIGN_IN
      if (API_CUSTOM_ERROR_CODES.ALREADY_USED === code) {
        await openNewTabToSignIn({ action: redirectAction, token, email, linkId, urlPassword })
        return
      }
      // Other errors we show the error message
      setError(message || c('Error').t`Email is not valid`)
    }
  }

  return (
    <ModalTwo
      as={Form}
      onSubmit={handleSubmit}
      enableCloseWhenClickOutside
      onClose={() => {
        countActionWithTelemetry(Actions.DismissSignUpFlowModal)
        onClose()
      }}
      size="small"
      {...modalProps}
      data-testid="public-doc-sign-in"
    >
      <ModalTwoHeader
        title={
          <div className="flex-column mb-1 flex">
            <DriveLogo variant="glyph-only" size={12} />
            {redirectAction === RedirectAction.MakeCopy
              ? c('Title').t`Make a copy to your ${DRIVE_APP_NAME}`
              : c('Title').t`Save it for later in ${DRIVE_APP_NAME}`}
          </div>
        }
        subline={c('Info').t`Keep your files secure with end-to-end encryption.`}
      />
      <ModalTwoContent className="mt-4">
        <InputFieldTwo
          data-testid="public-share-signup-modal-email"
          id="public-share-signup-modal-email"
          label={c('Label').t`Log in or sign up `}
          onChange={handleChangeEmail}
          placeholder={c('Placeholder').t`Email`}
          type="email"
          error={error}
          value={email}
        />
        <span className="flex items-center gap-1">
          <Icon className="color-primary" name="gift" />
          {c('Info').t`Free 5GB encrypted storage to get started`}
        </span>
      </ModalTwoContent>
      <ModalTwoFooter className="flex-column flex items-center">
        <Button color="norm" size="large" type="submit" fullWidth={true}>{c('Action').t`Continue`}</Button>
      </ModalTwoFooter>
    </ModalTwo>
  )
}

export const useSignupFlowModal = () => {
  return useModalTwoStatic(SignupFlowModal)
}
