import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Loader from '@proton/components/components/loader/Loader';

import { Lost2FAContext } from '../../Lost2FAContext';
import { Lost2FAStepLayout } from '../../Lost2FAStepLayout';
import { selectEmailAwaitingCode } from '../../state-machine/lost2FAStateMachine';
import { useLost2FATelemetry } from '../../useLost2FATelemetry';
import { VerifyCodeForm } from '../VerifyCodeForm';

/** The code is sent to the recovery email as soon as the screen opens. */
const VerifyOwnershipWithEmailContent = () => {
    const actorRef = Lost2FAContext.useActorRef();
    const sendingCodeFailed = Lost2FAContext.useSelector((snapshot) =>
        snapshot.matches({ verifyOwnershipWithEmail: 'sendingCodeFailed' })
    );
    const canRetry = Lost2FAContext.useSelector((snapshot) =>
        snapshot.can({ type: 'verification.sendingCodeRetried' })
    );
    const awaitingCode = Lost2FAContext.useSelector(selectEmailAwaitingCode);

    const { sendStepLoad } = useLost2FATelemetry();
    useEffect(() => {
        if (sendingCodeFailed) {
            return;
        }
        sendStepLoad('verify ownership with email');
    }, [sendingCodeFailed]);

    if (sendingCodeFailed) {
        return (
            <>
                <div className="mb-8">{c('Error').t`Something went wrong. Please try again.`}</div>
                {canRetry && (
                    <Button
                        size="large"
                        color="norm"
                        fullWidth
                        className="mb-2"
                        onClick={() => actorRef.send({ type: 'verification.sendingCodeRetried' })}
                    >
                        {c('Action').t`Try again`}
                    </Button>
                )}
                <Button size="large" fullWidth onClick={() => actorRef.send({ type: 'lost2FA.otherMethodRequested' })}>
                    {c('Action').t`Try another way`}
                </Button>
            </>
        );
    }

    if (!awaitingCode) {
        return <Loader />;
    }

    return <VerifyCodeForm method="email" />;
};

export const VerifyOwnershipWithEmailScreen = () => (
    <Lost2FAStepLayout title={c('Title').t`Disable two-factor authentication?`}>
        <VerifyOwnershipWithEmailContent />
    </Lost2FAStepLayout>
);
