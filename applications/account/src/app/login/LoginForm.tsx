import { c } from 'ttag';
import React, { useState } from 'react';
import { noop } from 'proton-shared/lib/helpers/function';
import { useLoading, FormField, InputTwo, PasswordInputTwo, Button, useFormErrors } from 'react-components';
import { requiredValidator } from 'proton-shared/lib/helpers/formValidators';

import ButtonSpacer from '../public/ButtonSpacer';

interface Props {
    onSubmit: (username: string, password: string) => Promise<void>;
    defaultUsername?: string;
}

const LoginForm = ({ onSubmit, defaultUsername = '' }: Props) => {
    const [loading, withLoading] = useLoading();
    const [username, setUsername] = useState(defaultUsername);
    const [password, setPassword] = useState('');

    const { validator, onFormSubmit } = useFormErrors();

    return (
        <form
            name="loginForm"
            className="signup-form"
            onSubmit={(event) => {
                event.preventDefault();
                if (loading || !onFormSubmit()) {
                    return;
                }
                withLoading(onSubmit(username, password)).catch(noop);
            }}
            method="post"
        >
            <FormField
                id="username"
                bigger
                label={c('Label').t`Email or username`}
                error={validator([requiredValidator(username)])}
            >
                <InputTwo
                    autoFocus
                    disableChange={loading}
                    autoComplete="username"
                    value={username}
                    onValue={setUsername}
                />
            </FormField>
            <FormField
                id="password"
                bigger
                label={c('Label').t`Password`}
                error={validator([requiredValidator(password)])}
            >
                <PasswordInputTwo
                    disableChange={loading}
                    autoComplete="current-password"
                    value={password}
                    onValue={setPassword}
                />
            </FormField>
            <ButtonSpacer>
                <Button size="large" color="norm" type="submit" fullWidth loading={loading}>
                    {c('Action').t`Sign in`}
                </Button>
            </ButtonSpacer>
        </form>
    );
};

export default LoginForm;
