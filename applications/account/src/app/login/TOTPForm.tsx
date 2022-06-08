import { useState } from 'react';
import { c } from 'ttag';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { noop } from '@proton/util/function';

import { Button, useLoading, useFormErrors, InputFieldTwo } from '@proton/components';

interface Props {
    onSubmit: (totp: string) => Promise<void>;
}

const TOTPForm = ({ onSubmit }: Props) => {
    const [loading, withLoading] = useLoading();
    const [totp, setTotp] = useState('');
    const [isTotpRecovery, setIsRecovery] = useState(false);

    const { validator, onFormSubmit } = useFormErrors();

    return (
        <form
            name="totpForm"
            onSubmit={(event) => {
                event.preventDefault();
                if (loading || !onFormSubmit()) {
                    return;
                }
                withLoading(onSubmit(totp)).catch(noop);
            }}
            autoComplete="off"
            method="post"
        >
            {isTotpRecovery ? (
                <InputFieldTwo
                    id="recovery-code"
                    bigger
                    label={c('Label').t`Recovery code`}
                    error={validator([requiredValidator(totp)])}
                    disableChange={loading}
                    autoFocus
                    value={totp}
                    onValue={setTotp}
                />
            ) : (
                <InputFieldTwo
                    id="twoFa"
                    bigger
                    label={c('Label').t`Two-factor authentication code`}
                    error={validator([requiredValidator(totp)])}
                    disableChange={loading}
                    autoFocus
                    autoCapitalize="off"
                    autoCorrect="off"
                    autoComplete="one-time-code"
                    value={totp}
                    onValue={setTotp}
                    inputMode="numeric"
                />
            )}
            <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt1-75">
                {c('Action').t`Authenticate`}
            </Button>
            <Button
                size="large"
                color="norm"
                shape="ghost"
                fullWidth
                className="mt0-5"
                onClick={() => {
                    if (loading) {
                        return;
                    }
                    setTotp('');
                    setIsRecovery(!isTotpRecovery);
                }}
            >
                {isTotpRecovery ? c('Action').t`Use two-factor authentication code` : c('Action').t`Use recovery code`}
            </Button>
        </form>
    );
};

export default TOTPForm;
