import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Row, Label, Field, PasswordInput, TwoFactorInput } from '../../components';

const PasswordTotpInputs = ({ password, setPassword, passwordError, totp, setTotp, totpError, showTotp }) => {
    return (
        <>
            <Row>
                <Label htmlFor="password">{c('Label').t`Password`}</Label>
                <Field>
                    <PasswordInput
                        placeholder={c('Placeholder').t`Password`}
                        id="password"
                        value={password}
                        onChange={({ target: { value } }) => setPassword(value)}
                        error={passwordError}
                        autoFocus
                        autoComplete="current-password"
                        required
                    />
                </Field>
            </Row>
            {showTotp && (
                <Row>
                    <Label htmlFor="totp">{c('Label').t`Two-factor authentication code`}</Label>
                    <Field>
                        <TwoFactorInput
                            placeholder={c('Placeholder').t`Two-factor authentication code`}
                            id="totp"
                            value={totp}
                            error={totpError}
                            onChange={({ target: { value } }) => setTotp(value)}
                            required
                        />
                    </Field>
                </Row>
            )}
        </>
    );
};

PasswordTotpInputs.propTypes = {
    password: PropTypes.string.isRequired,
    passwordError: PropTypes.string,
    setPassword: PropTypes.func.isRequired,
    totp: PropTypes.string.isRequired,
    totpError: PropTypes.string,
    setTotp: PropTypes.func.isRequired,
    showTotp: PropTypes.bool,
};

export default PasswordTotpInputs;
