import { c } from 'ttag';

import { useFido2Action } from '@proton/account/fido/useFido2Action';
import { Button } from '@proton/atoms/Button/Button';
import { AuthSecurityKeyContent } from '@proton/components';
import { useLoading } from '@proton/hooks';
import type { Fido2Data, Fido2Response } from '@proton/shared/lib/authentication/interface';
import { getAuthentication } from '@proton/shared/lib/webauthn/get';
import noop from '@proton/utils/noop';

interface Props {
    onSubmit: (data: Fido2Data) => Promise<void>;
    fido2: Fido2Response;
}

const Fido2Form = ({ onSubmit, fido2 }: Props) => {
    const [loading, withLoading] = useLoading(false);
    const { fidoError, awaitingTouch, runFido2Action } = useFido2Action();

    return (
        <>
            <AuthSecurityKeyContent awaitingTouch={awaitingTouch} error={fidoError} />
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
                        const authenticationCredentialsPayload = await runFido2Action(
                            (signal) => getAuthentication(fido2.AuthenticationOptions, signal),
                            'auth'
                        );
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
