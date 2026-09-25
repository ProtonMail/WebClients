import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { TotpInputField } from '@proton/components/containers/account/totp/TotpInputs';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { PasswordAccountContext } from '../../PasswordAccountContext';
import { selectSubmitting, selectTwoFactorError } from '../../state-machine/passwordAccountStateMachine';

export const TotpForm = () => {
    const actorRef = PasswordAccountContext.useActorRef();
    const submitting = PasswordAccountContext.useSelector(selectSubmitting);
    const twoFactorError = PasswordAccountContext.useSelector(selectTwoFactorError) || '';
    const [code, setCode] = useState('');
    const hasBeenAutoSubmitted = useRef(false);

    const { validator, onFormSubmit } = useFormErrors();

    const safeCode = code.replaceAll(/\s+/g, '');
    const requiredError = requiredValidator(safeCode);

    const submit = () => {
        actorRef.send({ type: 'twoFactor.submitted', payload: { credentials: { type: 'code', payload: safeCode } } });
    };

    useEffect(() => {
        if (submitting || requiredError || hasBeenAutoSubmitted.current) {
            return;
        }
        // Auto-submit the form once the user has entered the TOTP
        if (safeCode.length === 6) {
            // Do it just one time
            hasBeenAutoSubmitted.current = true;
            submit();
        }
    }, [safeCode]);

    return (
        <form
            name="totpForm"
            onSubmit={(event) => {
                event.preventDefault();
                if (submitting || !onFormSubmit()) {
                    return;
                }
                submit();
            }}
            autoComplete="off"
            method="post"
        >
            <TotpInputField
                code={code}
                error={validator([requiredError]) || twoFactorError}
                loading={submitting}
                setCode={(value: string) => {
                    setCode(value);
                    actorRef.send({ type: 'twoFactor.codeEdited' });
                }}
            />
            <Button size="large" color="norm" type="submit" fullWidth loading={submitting} className="mt-6">
                {submitting ? c('Action').t`Authenticating` : c('Action').t`Authenticate`}
            </Button>
        </form>
    );
};
