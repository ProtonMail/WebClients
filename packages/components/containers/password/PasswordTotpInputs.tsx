import React from 'react';
import { c } from 'ttag';
import { Row, Label, Field, PasswordInput, TwoFactorInput } from '../../components';

interface Props {
    password: string;
    setPassword: (value: string) => void;
    totp: string;
    setTotp: (value: string) => void;
    showTotp: boolean;
    totpError?: string;
    passwordError?: string;
}
const PasswordTotpInputs = ({ password, setPassword, passwordError, totp, setTotp, totpError, showTotp }: Props) => {
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

export default PasswordTotpInputs;
