import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { InputFieldTwo, useFormErrors } from '@proton/components';
import { useLoading } from '@proton/hooks';
import {
    requiredValidator,
    usernameCharacterValidator,
    usernameEndCharacterValidator,
    usernameLengthValidator,
    usernameStartCharacterValidator,
} from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

interface Props {
    onSubmit: (username: string, domain: string) => Promise<void>;
    availableDomains?: string[];
    defaultUsername?: string;
}

const GenerateAddressform = ({ defaultUsername = '', onSubmit, availableDomains }: Props) => {
    const [loading, withLoading] = useLoading();
    const [username, setUsername] = useState(defaultUsername);

    const { validator, onFormSubmit } = useFormErrors();

    const trimmedUsername = username.trim();
    const domain = availableDomains?.length ? availableDomains[0] : '';

    return (
        <form
            name="addressForm"
            onSubmit={(event) => {
                event.preventDefault();
                if (loading || !onFormSubmit()) {
                    return;
                }
                withLoading(onSubmit(trimmedUsername, domain)).catch(noop);
            }}
            method="post"
        >
            <InputFieldTwo
                bigger
                id="username"
                label={c('Label').t`Username`}
                error={validator([
                    requiredValidator(trimmedUsername),
                    usernameLengthValidator(trimmedUsername),
                    usernameStartCharacterValidator(trimmedUsername),
                    usernameEndCharacterValidator(trimmedUsername),
                    usernameCharacterValidator(trimmedUsername),
                ])}
                autoFocus
                disableChange={loading}
                value={username}
                onValue={setUsername}
                suffix={`@${domain}`}
            />
            <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt-6">
                {c('Action').t`Continue`}
            </Button>
        </form>
    );
};

export default GenerateAddressform;
