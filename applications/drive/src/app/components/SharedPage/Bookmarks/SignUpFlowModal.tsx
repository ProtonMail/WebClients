import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton';
import {
    Form,
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useApi,
} from '@proton/components';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { queryCheckEmailAvailability } from '@proton/shared/lib/api/user';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { DRIVE_SIGNIN, DRIVE_SIGNUP } from '@proton/shared/lib/drive/urls';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { emailValidator } from '@proton/shared/lib/helpers/formValidators';

import { deleteStoredUrlPassword, saveUrlPasswordForRedirection } from '../../../utils/url/password';

export const SignUpFlowModal = ({ urlPassword }: { urlPassword: string }) => {
    const [open, setOpen] = useState(true);
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
                window.location.href = DRIVE_SIGNUP;
            }
        } catch (err) {
            const { code, message } = getApiError(err);
            if (API_CUSTOM_ERROR_CODES.ALREADY_USED === code) {
                // Email is already in use, we redirect to SIGN_IN
                saveUrlPasswordForRedirection(urlPassword);
                window.location.href = DRIVE_SIGNIN;
            }
            // Other errors we show the error message
            setError(message || c('Error').t`Email is not valid`);
        }
    };

    return (
        <ModalTwo role="dialog" as={Form} open={open} onSubmit={handleSubmit} onClose={() => setOpen(false)}>
            <ModalTwoHeader
                title={c('Title').t`Sign in`}
                subline={c('Info').t`Keep your file secure with end-to-end encryption in ${DRIVE_APP_NAME}.`}
            />
            <ModalTwoContent>
                <InputFieldTwo
                    data-testid="public-share-signup-modal-email"
                    id="public-share-signup-modal-email"
                    label={c('Label').t`Email`}
                    onChange={handleChangeEmail}
                    placeholder={c('Placeholder').t`Enter your email address`}
                    type="email"
                    error={error}
                    value={email}
                />
            </ModalTwoContent>
            <ModalTwoFooter className="flex flex-column items-center">
                <Button color="norm" size="large" type="submit" fullWidth={true}>{c('Action').t`Continue`}</Button>
                <hr className="w-full my-3 border-bottom border-weak" />
                <InlineLinkButton onClick={() => setOpen(false)}>{c('Action').t`Skip`}</InlineLinkButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
