import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InputField as InputFieldTwo } from '@proton/components/components/v2/field/InputField';
import PasswordInputTwo from '@proton/components/components/v2/input/PasswordInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import Text from '../../../../../public/Text';

interface Props {
    email: string;
    loading?: boolean;
    error?: string | null;
    onSubmit: (password: string) => void;
    onChangePassword?: () => void;
}

/**
 * Proves the user owned the claimed address by asking for the password of the account it belonged
 * to. There is deliberately no "Forgot password?" link: the address is disabled, so none of the
 * recovery methods behind it can reach this account.
 */
const ClaimedAddressPasswordForm = ({ email, loading, error, onSubmit, onChangePassword }: Props) => {
    const [password, setPassword] = useState('');
    const { validator, onFormSubmit } = useFormErrors();

    const boldEmail = <strong key="email">{email}</strong>;

    return (
        <form
            name="claimedAddressPasswordForm"
            data-testid="claimed-address:password-form"
            onSubmit={(event) => {
                event.preventDefault();
                if (loading || !onFormSubmit()) {
                    return;
                }
                onSubmit(password);
            }}
            method="post"
        >
            <Text>{c('Info').jt`Enter your old password for ${boldEmail}.`}</Text>
            <InputFieldTwo
                id="password"
                bigger
                autoFocus
                label={c('Label').t`Password`}
                as={PasswordInputTwo}
                error={validator([requiredValidator(password)]) || error}
                disableChange={loading}
                autoComplete="current-password"
                value={password}
                onValue={(value: string) => {
                    setPassword(value);
                    onChangePassword?.();
                }}
            />
            <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt-6">
                {c('Action').t`Continue`}
            </Button>
        </form>
    );
};

export default ClaimedAddressPasswordForm;
