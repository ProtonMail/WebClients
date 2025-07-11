import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { InputFieldTwo, PasswordInputTwo, useFormErrors } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

interface Props {
    onSubmit: (keyPassword: string) => Promise<void>;
}

const getPasswordData = () => {
    return {
        formName: 'unlockForm',
        passwordId: 'mailboxPassword',
        passwordLabel: c('Label').t`Second password`,
        cta: c('Action').t`Unlock`,
    };
};

const UnlockForm = ({ onSubmit }: Props) => {
    const [loading, withLoading] = useLoading();
    const [keyPassword, setKeyPassword] = useState('');

    const { validator, onFormSubmit } = useFormErrors();

    const data = getPasswordData();

    return (
        <form
            name={data.formName}
            onSubmit={(event) => {
                event.preventDefault();
                if (loading || !onFormSubmit()) {
                    return;
                }
                withLoading(onSubmit(keyPassword)).catch(noop);
            }}
            method="post"
        >
            <InputFieldTwo
                as={PasswordInputTwo}
                id={data.passwordId}
                bigger
                label={data.passwordLabel}
                error={validator([requiredValidator(keyPassword)])}
                disableChange={loading}
                autoFocus
                value={keyPassword}
                onValue={setKeyPassword}
                /**
                 * Mark this field as ignored for Pass extension, to avoid Pass
                 * prompting auto-save after submitting the form, which could make users
                 * accidentally overwrite their first password with their mailbox password
                 * (login items in Pass only support a single password field).
                 * This will also prevent Pass from autofilling this field but we expect most users
                 * to only put their first password and not mailbox password as their login password.
                 */
                data-protonpass-ignore={true}
            />
            <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt-6">
                {data.cta}
            </Button>
        </form>
    );
};

export default UnlockForm;
