import { c } from 'ttag';

import { InputFieldTwo, PasswordInputTwo } from '../../components';

interface Props {
    password: string;
    setPassword?: (value: string) => void;
    totp: string;
    setTotp: (value: string) => void;
    showTotp: boolean;
    totpError?: string;
    passwordError?: string;
}

const PasswordTotpInputs = ({ password, setPassword, passwordError, totp, setTotp, totpError, showTotp }: Props) => {
    return (
        <>
            {setPassword && (
                <InputFieldTwo
                    required
                    autoFocus
                    autoComplete="current-password"
                    id="password"
                    as={PasswordInputTwo}
                    value={password}
                    error={passwordError}
                    onValue={setPassword}
                    label={c('Label').t`Password`}
                    placeholder={c('Placeholder').t`Password`}
                />
            )}

            {showTotp && (
                <InputFieldTwo
                    required
                    autoFocus={!setPassword}
                    autoCapitalize="off"
                    autoCorrect="off"
                    autoComplete="one-time-code"
                    id="totp"
                    value={totp}
                    error={totpError}
                    onValue={setTotp}
                    placeholder={c('Placeholder').t`Two-factor authentication code`}
                    label={c('Label').t`Two-factor authentication code`}
                />
            )}
        </>
    );
};

export default PasswordTotpInputs;
