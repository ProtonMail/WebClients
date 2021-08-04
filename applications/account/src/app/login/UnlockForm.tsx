import { useState } from 'react';
import { c } from 'ttag';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { noop } from '@proton/shared/lib/helpers/function';

import { Button, useLoading, PasswordInputTwo, useFormErrors, InputFieldTwo } from '@proton/components';

interface Props {
    onSubmit: (keyPassword: string) => Promise<void>;
}

const UnlockForm = ({ onSubmit }: Props) => {
    const [loading, withLoading] = useLoading();
    const [keyPassword, setKeyPassword] = useState('');

    const { validator, onFormSubmit } = useFormErrors();

    return (
        <form
            name="unlockForm"
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
                id="mailboxPassword"
                bigger
                label={c('Label').t`Mailbox password`}
                error={validator([requiredValidator(keyPassword)])}
                disableChange={loading}
                autoFocus
                value={keyPassword}
                onValue={setKeyPassword}
            />
            <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt1-75">
                {c('Action').t`Unlock`}
            </Button>
        </form>
    );
};

export default UnlockForm;
