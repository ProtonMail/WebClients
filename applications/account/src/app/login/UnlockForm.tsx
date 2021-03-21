import React, { useState } from 'react';
import { c } from 'ttag';
import { requiredValidator } from 'proton-shared/lib/helpers/formValidators';
import { noop } from 'proton-shared/lib/helpers/function';

import { Button, useLoading, FormField, PasswordInputTwo, useFormErrors } from 'react-components';

import ButtonSpacer from '../public/ButtonSpacer';

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
            className="signup-form"
            onSubmit={(event) => {
                event.preventDefault();
                if (loading || !onFormSubmit()) {
                    return;
                }
                withLoading(onSubmit(keyPassword)).catch(noop);
            }}
            method="post"
        >
            <FormField
                id="mailboxPassword"
                bigger
                label={c('Label').t`Mailbox password`}
                error={validator([requiredValidator(keyPassword)])}
            >
                <PasswordInputTwo disableChange={loading} autoFocus value={keyPassword} onValue={setKeyPassword} />
            </FormField>
            <ButtonSpacer>
                <Button size="large" color="norm" type="submit" fullWidth loading={loading}>
                    {c('Action').t`Unlock`}
                </Button>
            </ButtonSpacer>
        </form>
    );
};

export default UnlockForm;
