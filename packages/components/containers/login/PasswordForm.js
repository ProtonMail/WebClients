import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Input, Label, PasswordInput } from 'react-components';

const PasswordForm = ({ username, setUsername, password, setPassword }) => {
    return (
        <>
            <Label htmlFor="login" className="bl sr-only">
                {c('Label').t`Username`}
            </Label>
            <div className="mb1">
                <Input
                    type="text"
                    name="login"
                    autoFocus
                    autoCapitalize="off"
                    autoCorrect="off"
                    id="login"
                    required
                    value={username}
                    placeholder={c('Placeholder').t`Username or email`}
                    onChange={({ target: { value } }) => setUsername(value)}
                    data-cy-login="username"
                />
            </div>
            <Label htmlFor="password" className="bl sr-only">
                {c('Label').t`Password`}
            </Label>
            <div className="mb1">
                <PasswordInput
                    name="password"
                    autoComplete="current-password"
                    id="password"
                    required
                    value={password}
                    placeholder={c('Placeholder').t`Password`}
                    onChange={({ target: { value } }) => setPassword(value)}
                    data-cy-login="password"
                />
            </div>
        </>
    );
};

PasswordForm.propTypes = {
    username: PropTypes.string,
    password: PropTypes.string,
    setUsername: PropTypes.func,
    setPassword: PropTypes.func
};

export default PasswordForm;
