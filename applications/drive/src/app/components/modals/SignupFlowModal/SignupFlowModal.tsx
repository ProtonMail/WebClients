import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
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
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { queryCheckEmailAvailability } from '@proton/shared/lib/api/user';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { DRIVE_SIGNIN, DRIVE_SIGNUP } from '@proton/shared/lib/drive/urls';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { emailValidator } from '@proton/shared/lib/helpers/formValidators';

import { deleteStoredUrlPassword, saveUrlPasswordForRedirection } from '../../../utils/url/password';

export const SignupFlowModal = ({ urlPassword, onClose, ...modalProps }: { urlPassword: string } & ModalStateProps) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const api = useApi();

    useEffect(() => {
        deleteStoredUrlPassword();
    }, []);

    const handleChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        setError(emailValidator(e.target.value));
    };

    const handleSubmit = async () => {
        try {
            const { Code } = await api({ ...queryCheckEmailAvailability(email) });
            // Email is verified and available to use
            // We redirect to DRIVE_SIGNUP
            if (Code === 1000) {
                saveUrlPasswordForRedirection(urlPassword);
                replaceUrl(DRIVE_SIGNUP);
            }
        } catch (err) {
            const { code, message } = getApiError(err);
            if (API_CUSTOM_ERROR_CODES.ALREADY_USED === code) {
                // Email is already in use, we redirect to SIGN_IN
                saveUrlPasswordForRedirection(urlPassword);
                replaceUrl(DRIVE_SIGNIN);
            }
            // Other errors we show the error message
            setError(message || c('Error').t`Email is not valid`);
        }
    };

    return (
        <ModalTwo
            as={Form}
            onSubmit={handleSubmit}
            onClose={onClose}
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
