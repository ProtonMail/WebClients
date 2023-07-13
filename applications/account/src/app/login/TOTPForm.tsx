import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { TotpInputs, useFormErrors } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

interface Props {
    onSubmit: (totp: string) => Promise<void>;
}

const TOTPForm = ({ onSubmit }: Props) => {
    const [loading, withLoading] = useLoading();
    const [code, setCode] = useState('');
    const [type, setType] = useState<'totp' | 'recovery-code'>('totp');
    const hasBeenAutoSubmitted = useRef(false);

    const { validator, onFormSubmit, reset } = useFormErrors();

    const safeCode = code.replaceAll(/\s+/g, '');
    const requiredError = requiredValidator(safeCode);

    useEffect(() => {
        if (type !== 'totp' || loading || requiredError || hasBeenAutoSubmitted.current) {
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
            <TotpInputs
                type={type}
                code={code}
                error={validator([requiredError])}
                loading={loading}
                setCode={setCode}
                bigger={true}
            />
            <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt-6">
                {c('Action').t`Authenticate`}
            </Button>
            <Button
                size="large"
                color="norm"
                shape="ghost"
                fullWidth
                className="mt-2"
                onClick={() => {
                    if (loading) {
                        return;
                    }
                    reset();
                    setCode('');
                    setType(type === 'totp' ? 'recovery-code' : 'totp');
                }}
            >
                {type === 'totp' ? c('Action').t`Use recovery code` : c('Action').t`Use authentication code`}
            </Button>
        </form>
    );
};

export default TOTPForm;
