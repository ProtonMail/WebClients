import { c } from 'ttag';
import { useState } from 'react';
import * as React from 'react';
import { noop } from '@proton/shared/lib/helpers/function';
import { Api } from '@proton/shared/lib/interfaces';
import { validateEmail } from '@proton/shared/lib/api/core/validate';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { Button, useFormErrors, InputFieldTwo } from '../../../components';
import { useLoading } from '../../../hooks';

interface Props {
    onSubmit: (email: string) => Promise<void>;
    defaultEmail?: string;
    api: Api;
}

const EmailMethodForm = ({ api, onSubmit, defaultEmail = '' }: Props) => {
    const [email, setEmail] = useState(defaultEmail);
    const [loading, withLoading] = useLoading();
    const [emailError, setEmailError] = useState('');

    const { validator, onFormSubmit } = useFormErrors();

    const handleSubmit = async () => {
        if (loading || !onFormSubmit()) {
            return;
        }

        try {
            await api(validateEmail(email));
        } catch (error) {
            setEmailError(getApiErrorMessage(error) || c('Error').t`Can't validate email, try again later`);
            throw error;
        }

        await onSubmit(email);
    };

    return (
        <>
            <InputFieldTwo
                id="email"
                bigger
                label={c('Label').t`Email address`}
                error={validator([requiredValidator(email), emailError])}
                disableChange={loading}
                autoFocus
                type="email"
                value={email}
                onValue={(value: string) => {
                    setEmailError('');
                    setEmail(value);
                }}
                onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        withLoading(handleSubmit()).catch(noop);
                    }
                }}
            />
            <Button
                size="large"
                color="norm"
                type="button"
                fullWidth
                loading={loading}
                onClick={() => withLoading(handleSubmit()).catch(noop)}
                className="mt1-75"
            >
                {c('Action').t`Get verification code`}
            </Button>
        </>
    );
};

export default EmailMethodForm;
