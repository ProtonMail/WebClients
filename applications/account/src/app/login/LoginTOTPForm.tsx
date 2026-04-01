import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useFormErrors } from '@proton/components';
import { TotpInputField } from '@proton/components/containers/account/totp/TotpInputs';
import { useLoading } from '@proton/hooks';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

interface Props {
    onSubmit: (totp: string) => Promise<void>;
}

const LoginTOTPForm = ({ onSubmit }: Props) => {
    const [loading, withLoading] = useLoading();
    const [code, setCode] = useState('');
    const hasBeenAutoSubmitted = useRef(false);

    const { validator, onFormSubmit } = useFormErrors();

    const safeCode = code.replaceAll(/\s+/g, '');
    const requiredError = requiredValidator(safeCode);

    useEffect(() => {
        if (loading || requiredError || hasBeenAutoSubmitted.current) {
            return;
        }
        // Auto-submit the form once the user has entered the TOTP
        if (safeCode.length === 6) {
            // Do it just one time
            hasBeenAutoSubmitted.current = true;
            withLoading(onSubmit(safeCode)).catch(noop);
        }
    }, [safeCode]);

    return (
        <form
            name="totpForm"
            onSubmit={(event) => {
                event.preventDefault();
                if (loading || !onFormSubmit()) {
                    return;
                }
                withLoading(onSubmit(safeCode)).catch(noop);
            }}
            autoComplete="off"
            method="post"
        >
            <TotpInputField code={code} error={validator([requiredError])} loading={loading} setCode={setCode} />
            <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt-6">
                {loading ? c('Action').t`Authenticating` : c('Action').t`Authenticate`}
            </Button>
        </form>
    );
};

export default LoginTOTPForm;
