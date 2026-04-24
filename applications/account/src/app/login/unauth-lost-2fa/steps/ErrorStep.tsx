import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { useUnauthLost2FA } from '../UnauthedLost2FAContainer';
import { useUnauthedLost2FATelemetry } from '../useUnauthedLost2FATelemetry';

export const ErrorStep = () => {
    const { useUnauthLost2FAActorRef } = useUnauthLost2FA();
    const { send } = useUnauthLost2FAActorRef();

    const { sendStepLoad } = useUnauthedLost2FATelemetry();
    useEffect(() => {
        sendStepLoad('error');
    }, []);

    return (
        <>
            <div className="mb-8">{c('Info').t`Something went wrong. Please try again.`}</div>
            <Button size="large" fullWidth onClick={() => send({ type: 'back' })}>
                {c('Action').t`Return to sign-in`}
            </Button>
        </>
    );
};
