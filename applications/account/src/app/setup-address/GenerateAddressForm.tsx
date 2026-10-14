import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InputField as InputFieldTwo } from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import {
    requiredValidator,
    usernameCharacterValidator,
    usernameEndCharacterValidator,
    usernameLengthValidator,
    usernameNoEmailValidator,
    usernameStartCharacterValidator,
} from '@proton/shared/lib/helpers/formValidators';

interface Props {
    onSubmit: (username: string, domain: string) => void;
    loading?: boolean;
    availableDomains?: string[];
    defaultUsername?: string;
    /** Why the last username was rejected, shown under the field. */
    error?: string;
    /** The user changed the username. */
    onChange?: () => void;
}

const GenerateAddressForm = ({
    defaultUsername = '',
    onSubmit,
    loading = false,
    availableDomains,
    error,
    onChange,
}: Props) => {
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
                onSubmit(trimmedUsername, domain);
            }}
            method="post"
        >
            <InputFieldTwo
                bigger
                id="username"
                label={c('Label').t`Username`}
                error={
                    validator([
                        requiredValidator(trimmedUsername),
                        usernameLengthValidator(trimmedUsername),
                        usernameNoEmailValidator(trimmedUsername),
                        usernameStartCharacterValidator(trimmedUsername),
                        usernameEndCharacterValidator(trimmedUsername),
                        usernameCharacterValidator(trimmedUsername),
                    ]) || error
                }
                autoFocus
                disableChange={loading}
                value={username}
                onValue={(value: string) => {
                    setUsername(value);
                    onChange?.();
                }}
                suffix={`@${domain}`}
            />
            <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt-6">
                {c('Action').t`Continue`}
            </Button>
        </form>
    );
};

export default GenerateAddressForm;
