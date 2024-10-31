import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components';
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
} from '@proton/components';
import { PLANS } from '@proton/payments';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { queryCheckEmailAvailability } from '@proton/shared/lib/api/user';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, DRIVE_APP_NAME, SSO_PATHS } from '@proton/shared/lib/constants';
import { DRIVE_SIGNIN } from '@proton/shared/lib/drive/urls';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { emailValidator } from '@proton/shared/lib/helpers/formValidators';
import { getUrlWithReturnUrl } from '@proton/shared/lib/helpers/url';

import usePublicToken from '../../../hooks/drive/usePublicToken';
import { RedirectionReason, drivePublicRedirectionReasonKey } from '../../../hooks/util/useRedirectToPublicPage';
import { Actions, countActionWithTelemetry, traceTelemetry } from '../../../utils/telemetry';
import { deleteStoredUrlPassword, saveUrlPasswordForRedirection } from '../../../utils/url/password';

export interface Props {
    customPassword?: string;
}
export const SignupFlowModal = ({ customPassword, onClose, ...modalProps }: Props & ModalStateProps) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const api = useApi();
    const { token, urlPassword } = usePublicToken();

    useEffect(() => {
        deleteStoredUrlPassword();
        countActionWithTelemetry(Actions.ViewSignUpFlowModal);
    }, []);

    const handleChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        setError(emailValidator(e.target.value));
    };

    /*
     * Sign-up flow: Redirect to /shared-with-me, then auto-add bookmarks in MainContainer.tsx
     * Sign-in flow: Auto-add bookmarks in MainContainer.tsx and redirect back to public page
     */
    const handleSubmit = async () => {
        try {
            countActionWithTelemetry(Actions.SubmitSignUpFlowModal);
            const { Code } = await api({
                ...queryCheckEmailAvailability(email),
                silence: [API_CUSTOM_ERROR_CODES.ALREADY_USED, API_CUSTOM_ERROR_CODES.NOT_ALLOWED],
            });
            // Email is verified and available to use
            // We redirect to DRIVE_SIGNUP
            // If user pass proton domain we redirect him to signin page in all case
            if (Code === 1000) {
                saveUrlPasswordForRedirection(urlPassword + (customPassword ?? ''));
                await Promise.all([
                    countActionWithTelemetry(Actions.SignUpFlowModal),
                    traceTelemetry(Actions.SignUpFlowAndRedirectCompleted).start(),
                ]);
                const returnUrlSearchParams = new URLSearchParams();
                returnUrlSearchParams.append('token', token);
                const returnUrl = `/shared-with-me?`.concat(returnUrlSearchParams.toString());

                const url = new URL(getAppHref(SSO_PATHS.SIGNUP, APPS.PROTONACCOUNT));
                // This autofill the sign-up email input
                url.searchParams.append('email', email);
                url.searchParams.append('plan', PLANS.FREE);
                url.searchParams.append('product', 'drive');
                replaceUrl(
                    getUrlWithReturnUrl(url.toString(), {
                        returnUrl,
                        context: 'private',
                    })
                );
            }
        } catch (err) {
            const { code, message } = getApiError(err);
            // Email is already in use or if user pass proton domain we redirect him to, we redirect to SIGN_IN
            if (API_CUSTOM_ERROR_CODES.ALREADY_USED === code || API_CUSTOM_ERROR_CODES.NOT_ALLOWED === code) {
                saveUrlPasswordForRedirection(urlPassword + (customPassword ?? ''));
                await countActionWithTelemetry(Actions.SignInFlowModal);
                const returnUrlSearchParams = new URLSearchParams();
                returnUrlSearchParams.append('token', token);
                returnUrlSearchParams.append(drivePublicRedirectionReasonKey, RedirectionReason.SIGNIN);
                // Always return to public page in case of signin. This will be done in MainContainer.tsx on page loading
                const returnUrl = `/?`.concat(returnUrlSearchParams.toString());
                const url = new URL(DRIVE_SIGNIN);
                // This autofill the sign-in email input
                url.searchParams.append('username', email);
                url.searchParams.append('product', 'drive');
                replaceUrl(
                    getUrlWithReturnUrl(url.toString(), {
                        returnUrl,
                        context: 'private',
                    })
                );
                return;
            }
            // Other errors we show the error message
            setError(message || c('Error').t`Email is not valid`);
        }
    };

    return (
        <ModalTwo
            as={Form}
            onSubmit={handleSubmit}
            enableCloseWhenClickOutside
            onClose={() => {
                countActionWithTelemetry(Actions.DismissSignUpFlowModal);
                onClose();
            }}
            size="small"
            {...modalProps}
            data-testid="download-page-sign-in"
        >
            <ModalTwoHeader
                title={
                    <div className="flex flex-column mb-1">
                        <DriveLogo variant="glyph-only" size={12} />
                        {c('Title').t`Save it for later in ${DRIVE_APP_NAME}`}
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
            <ModalTwoFooter className="flex flex-column items-center">
                <Button color="norm" size="large" type="submit" fullWidth={true}>{c('Action').t`Continue`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export const useSignupFlowModal = () => {
    return useModalTwoStatic(SignupFlowModal);
};
