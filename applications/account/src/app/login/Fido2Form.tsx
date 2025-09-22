import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { AuthSecurityKeyContent } from '@proton/components';
import { useLoading } from '@proton/hooks';
import type { Fido2Data, Fido2Response } from '@proton/shared/lib/authentication/interface';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getAuthentication } from '@proton/shared/lib/webauthn/get';
import noop from '@proton/utils/noop';

interface Props {
    onSubmit: (data: Fido2Data) => Promise<void>;
    fido2: Fido2Response;
}

const Fido2Form = ({ onSubmit, fido2 }: Props) => {
    const [loading, withLoading] = useLoading(false);
    const [fidoError, setFidoError] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
            abortControllerRef.current = null;
        };
    }, []);

    return (
        <>
            <AuthSecurityKeyContent error={fidoError} />
            <Button
                autoFocus={true}
                size="large"
                color="norm"
                type="submit"
                fullWidth
                loading={loading}
                className="mt-6"
                onClick={() => {
                    if (loading) {
                        return;
                    }
                    const run = async () => {
                        let authenticationCredentialsPayload: Fido2Data;
                        try {
                            setFidoError(false);
                            abortControllerRef.current?.abort();
                            const abortController = new AbortController();
                            abortControllerRef.current = abortController;
                            authenticationCredentialsPayload = await getAuthentication(
                                fido2.AuthenticationOptions,
                                abortController.signal
                            );
                        } catch (error) {
                            setFidoError(true);
                            // Purposefully logging the error for somewhat easier debugging
                            captureMessage('Security key auth', { level: 'error', extra: { error } });
                            console.error(error);
                            return;
                        }
                        await onSubmit(authenticationCredentialsPayload);
                    };
                    withLoading(run()).catch(noop);
                }}
            >
                {c('Action').t`Authenticate`}
            </Button>
        </>
    );
};

export default Fido2Form;
