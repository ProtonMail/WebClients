import React, { useState } from 'react';
import { c } from 'ttag';
import { useLoading, Button, FormField, InputTwo, useFormErrors } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';
import { Api } from 'proton-shared/lib/interfaces';
import { queryCheckUsernameAvailability } from 'proton-shared/lib/api/user';
import { getApiErrorMessage } from 'proton-shared/lib/api/helpers/apiErrorHelper';
import { requiredValidator } from 'proton-shared/lib/helpers/formValidators';

import ButtonSpacer from '../public/ButtonSpacer';

interface Props {
    onSubmit: (username: string, domain: string) => void;
    availableDomains?: string[];
    api: Api;
    defaultUsername?: string;
}

const GenerateInternalAddressForm = ({ defaultUsername = '', onSubmit, availableDomains, api }: Props) => {
    const [loading, withLoading] = useLoading();
    const [username, setUsername] = useState(defaultUsername);
    const [usernameError, setUsernameError] = useState('');

    const { validator, onFormSubmit } = useFormErrors();

    const domain = availableDomains?.length ? availableDomains[0] : '';

    const handleSubmit = async () => {
        try {
            await api(queryCheckUsernameAvailability(username));
        } catch (e) {
            const errorText = getApiErrorMessage(e) || c('Error').t`Can't check username, try again later`;
            setUsernameError(errorText);
            throw e;
        }
        onSubmit(username, domain);
    };

    return (
        <form
            name="addressForm"
            className="signup-form"
            onSubmit={(event) => {
                event.preventDefault();
                if (loading || !onFormSubmit()) {
                    return;
                }
                withLoading(handleSubmit()).catch(noop);
            }}
            method="post"
        >
            <FormField
                bigger
                id="username"
                label={c('Label').t`Username`}
                error={validator([requiredValidator(username), usernameError])}
            >
                <InputTwo
                    autoFocus
                    disableChange={loading}
                    value={username}
                    onValue={(value) => {
                        setUsernameError('');
                        setUsername(value);
                    }}
                    suffix={`@${domain}`}
                />
            </FormField>
            <ButtonSpacer>
                <Button size="large" color="norm" type="submit" fullWidth loading={loading}>
                    {c('Action').t`Next`}
                </Button>
            </ButtonSpacer>
        </form>
    );
};

export default GenerateInternalAddressForm;
