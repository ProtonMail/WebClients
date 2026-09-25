import { c } from 'ttag';

import { useFido2Action } from '@proton/account/fido/useFido2Action';
import { Button } from '@proton/atoms/Button/Button';
import AuthSecurityKeyContent from '@proton/components/containers/account/fido/AuthSecurityKeyContent';
import useLoading from '@proton/hooks/useLoading';
import type { Fido2Response } from '@proton/shared/lib/authentication/interface';
import { getAuthentication } from '@proton/shared/lib/webauthn/get';
import noop from '@proton/utils/noop';

import { PasswordAccountContext } from '../../PasswordAccountContext';
import { selectSubmitting } from '../../state-machine/passwordAccountStateMachine';

export const Fido2Form = ({ fido2 }: { fido2: Fido2Response }) => {
    const actorRef = PasswordAccountContext.useActorRef();
    const submittingRequest = PasswordAccountContext.useSelector(selectSubmitting);
    // Covers the wait for the security key, before the machine takes over
    const [awaitingKey, withAwaitingKey] = useLoading(false);
    const submitting = submittingRequest || awaitingKey;
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
                loading={submitting}
                className="mt-6"
                onClick={() => {
                    if (submitting) {
                        return;
                    }
                    const run = async () => {
                        const payload = await runFido2Action(
                            (signal) => getAuthentication(fido2.AuthenticationOptions, signal),
                            'auth'
                        );
                        actorRef.send({
                            type: 'twoFactor.submitted',
                            payload: { credentials: { type: 'fido2', payload } },
                        });
                    };
                    withAwaitingKey(run()).catch(noop);
                }}
            >
                {c('Action').t`Authenticate`}
            </Button>
        </>
    );
};
