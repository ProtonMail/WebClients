import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PasswordInputTwo from '@proton/components/components/v2/input/PasswordInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

interface Props {
    onSubmit: (keyPassword: string) => void;
    submitting: boolean;
}

const getPasswordData = () => {
    return {
        formName: 'unlockForm',
        passwordId: 'mailboxPassword',
        passwordLabel: c('Label').t`Second password`,
        cta: c('Action').t`Unlock`,
    };
};

const UnlockForm = ({ onSubmit, submitting }: Props) => {
    const [keyPassword, setKeyPassword] = useState('');

    const { validator, onFormSubmit } = useFormErrors();

    const data = getPasswordData();

    return (
        <form
            name={data.formName}
            onSubmit={(event) => {
                event.preventDefault();
                if (submitting || !onFormSubmit()) {
                    return;
                }
                onSubmit(keyPassword);
            }}
            method="post"
        >
            <InputFieldTwo
                as={PasswordInputTwo}
                id={data.passwordId}
                bigger
                label={data.passwordLabel}
                error={validator([requiredValidator(keyPassword)])}
                disableChange={submitting}
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
            <Button size="large" color="norm" type="submit" fullWidth loading={submitting} className="mt-6">
                {data.cta}
            </Button>
        </form>
    );
};

export default UnlockForm;
