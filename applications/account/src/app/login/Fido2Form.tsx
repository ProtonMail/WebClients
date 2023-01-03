import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { AuthSecurityKeyContent, useLoading } from '@proton/components';
import { Fido2Data, Fido2Response } from '@proton/shared/lib/authentication/interface';
import { getAuthentication } from '@proton/shared/lib/webauthn/get';
import noop from '@proton/utils/noop';

interface Props {
    onSubmit: (data: Fido2Data) => Promise<void>;
    fido2: Fido2Response;
}

const Fido2Form = ({ onSubmit, fido2 }: Props) => {
    const [loading, withLoading] = useLoading(false);
    const [fidoError, setFidoError] = useState(false);

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
                className="mt1-5"
                onClick={() => {
                    if (loading) {
                        return;
                    }
                    const run = async () => {
                        let authenticationCredentialsPayload: Fido2Data;
                        try {
                            setFidoError(false);
                            authenticationCredentialsPayload = await getAuthentication(fido2.AuthenticationOptions);
                        } catch (error) {
                            setFidoError(true);
                            // Purposefully logging the error for somewhat easier debugging
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
