import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Input, Label } from 'react-components';

const UnlockForm = ({ password, setPassword }) => {
    return (
        <>
            <Label htmlFor="password">{c('Label').t`Mailbox password`}</Label>
            <Input
                type="text"
                name="password"
                autoFocus
                autoCapitalize="off"
                autoCorrect="off"
                id="password"
                required
                className="w100 mb1"
                value={password}
                placeholder={c('Placeholder').t`Mailbox password`}
                onChange={({ target: { value } }) => setPassword(value)}
                data-cy-login="mailbox password"
            />
        </>
    );
};

UnlockForm.propTypes = {
    password: PropTypes.string,
    setPassword: PropTypes.func
};

export default UnlockForm;
