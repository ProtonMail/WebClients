import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { c } from 'ttag';
import { Input, Label, Button } from 'react-components';

const LoginForm = ({ onSubmit, loading }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!username || !password) {
            return;
        }
        onSubmit({ username, password });
    };

    const onChange = (set) => ({ target }) => set(target.value);

    return (
        <form name="loginForm" noValidate onSubmit={handleSubmit}>
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
                onChange={onChange(setUsername)}
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
                onChange={onChange(setPassword)}
                data-cy-login="password"
            />
            <Button type="submit" className="pm-button-blue w100" disabled={loading} data-cy-login="submit">
                Login
            </Button>
            <p>
                <Link to="/support/login">Need help?</Link>
            </p>
            <p>
                <Link to="/signup">Create an account</Link>
            </p>
        </form>
    );
};

LoginForm.propTypes = {
    loading: PropTypes.bool,
    onSubmit: PropTypes.func
};

export default LoginForm;
