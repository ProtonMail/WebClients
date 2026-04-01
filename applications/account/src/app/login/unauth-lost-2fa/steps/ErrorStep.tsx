import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { useUnauthLost2FA } from '../UnauthedLost2FAContainer';

export const ErrorStep = () => {
    const { useUnauthLost2FAActorRef } = useUnauthLost2FA();
    const { send } = useUnauthLost2FAActorRef();

    return (
        <>
            <div className="mb-8">{c('Info').t`Something went wrong. Please try again.`}</div>
            <Button size="large" fullWidth onClick={() => send({ type: 'try again' })}>
                {c('Action').t`Try again`}
            </Button>
        </>
    );
};
