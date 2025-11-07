import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { TotpInputs, useFormErrors } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

interface Props {
    onSubmit: (totp: string) => Promise<void>;
}

const LoginTOTPForm = ({ onSubmit }: Props) => {
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
                {loading ? c('Action').t`Authenticating` : c('Action').t`Authenticate`}
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

            <hr className="my-4" />
            <div className="text-center">
                <Href href={getKnowledgeBaseUrl('/lost-two-factor-authentication-2fa?ref=account-web-signin')}>
                    {c('Link').t`Don't have access to your 2FA?`}
                </Href>
            </div>
        </form>
    );
};

export default LoginTOTPForm;
