import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Input, Label } from 'react-components';

const LoginForm = ({ username, setUsername, password, setPassword }) => {
    return (
        <>
            <Label htmlFor="login" className="bl sr-only">
                {c('Label').t`Username`}
            </Label>
            <Input
                type="text"
                name="login"
                className="w100 mb1"
                autoFocus
                autoCapitalize="off"
                autoCorrect="off"
                id="login"
                required
                value={username}
                placeholder={c('Placeholder').t`Username`}
                onChange={({ target: { value } }) => setUsername(value)}
                data-cy-login="username"
            />
            <Label htmlFor="password" className="bl sr-only">
                {c('Label').t`Password`}
            </Label>
            <Input
                type="password"
                name="password"
                className="w100 mb1"
                autoComplete="current-password"
                id="password"
                required
                value={password}
                placeholder={c('Placeholder').t`Password`}
                onChange={({ target: { value } }) => setPassword(value)}
                data-cy-login="password"
            />
        </>
    );
};

LoginForm.propTypes = {
    username: PropTypes.string,
    password: PropTypes.string,
    setUsername: PropTypes.func,
    setPassword: PropTypes.func
};

export default LoginForm;
