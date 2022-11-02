import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { InputFieldTwo, useFormErrors, useLoading } from '@proton/components';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { queryCheckUsernameAvailability } from '@proton/shared/lib/api/user';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

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

    const trimmedUsername = username.trim();
    const domain = availableDomains?.length ? availableDomains[0] : '';

    const handleSubmit = async () => {
        try {
            await api(queryCheckUsernameAvailability(`${trimmedUsername}@${domain}`, true));
        } catch (e: any) {
            const errorText = getApiErrorMessage(e) || c('Error').t`Can't check username, try again later`;
            setUsernameError(errorText);
            throw e;
        }
        onSubmit(trimmedUsername, domain);
    };

    return (
        <form
            name="addressForm"
            onSubmit={(event) => {
                event.preventDefault();
                if (loading || !onFormSubmit()) {
                    return;
                }
                withLoading(handleSubmit()).catch(noop);
            }}
            method="post"
        >
            <InputFieldTwo
                bigger
                id="username"
                label={c('Label').t`Username`}
                error={validator([requiredValidator(trimmedUsername), usernameError])}
                autoFocus
                disableChange={loading}
                value={username}
                onValue={(value: string) => {
                    setUsernameError('');
                    setUsername(value);
                }}
                suffix={`@${domain}`}
            />
            <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt1-5">
                {c('Action').t`Continue`}
            </Button>
        </form>
    );
};

export default GenerateInternalAddressForm;
