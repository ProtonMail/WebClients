import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Input, Label } from 'react-components';

const TOTPForm = ({ totp, setTotp }) => {
    return (
        <>
            <Label htmlFor="twoFa">{c('Label').t`Two-factor code`}</Label>
            <Input
                type="text"
                name="twoFa"
                autoFocus
                autoCapitalize="off"
                autoCorrect="off"
                id="twoFa"
                required
                value={totp}
                className="w100 mb1"
                placeholder={c('Placeholder').t`Two-factor code`}
                onChange={({ target: { value } }) => setTotp(value)}
                data-cy-login="TOTP"
            />
        </>
    );
};

TOTPForm.propTypes = {
    totp: PropTypes.string,
    setTotp: PropTypes.func
};

export default TOTPForm;
