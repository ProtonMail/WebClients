import { c } from 'ttag';
import React, { useState } from 'react';
import { noop } from 'proton-shared/lib/helpers/function';
import { useLoading, InputFieldTwo, PasswordInputTwo, Button, useFormErrors } from 'react-components';
import { requiredValidator } from 'proton-shared/lib/helpers/formValidators';

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
            <InputFieldTwo
                id="username"
                bigger
                label={c('Label').t`Email or username`}
                error={validator([requiredValidator(username)])}
                autoFocus
                disableChange={loading}
                autoComplete="username"
                value={username}
                onValue={setUsername}
            />
            <InputFieldTwo
                id="password"
                bigger
                label={c('Label').t`Password`}
                error={validator([requiredValidator(password)])}
                as={PasswordInputTwo}
                disableChange={loading}
                autoComplete="current-password"
                value={password}
                onValue={setPassword}
                rootClassName="mt0-25"
            />
            <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt1-75">
                {c('Action').t`Sign in`}
            </Button>
        </form>
    );
};

export default LoginForm;
