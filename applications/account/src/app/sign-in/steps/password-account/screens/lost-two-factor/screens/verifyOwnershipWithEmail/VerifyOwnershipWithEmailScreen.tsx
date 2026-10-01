import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Loader from '@proton/components/components/loader/Loader';

import type { SignInScreen, SignInScreenProps } from '../../../../../../routes/signInRoute';
import { useSignInProps } from '../../../../../../wizard/SignInProvider';
import { getDisableTwoFactorTitle } from '../../DisableTwoFactorTitle';
import { Lost2FAContext } from '../../Lost2FAContext';
import { Lost2FAUsername } from '../../Lost2FAUsername';
import {
    selectCanRetrySending,
    selectEmailAwaitingCode,
    selectEmailSendingFailed,
} from '../../state-machine/lost2FAStateMachine';
import { useLost2FATelemetry } from '../../useLost2FATelemetry';
import { VerifyCodeForm } from '../VerifyCodeForm';

/** The code is sent to the recovery email as soon as the screen opens. */
export const VerifyOwnershipWithEmailScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout } = useSignInProps();
    const heading = <layout.Header title={getDisableTwoFactorTitle()} subTitle={<Lost2FAUsername />} onBack={onBack} />;
    const actorRef = Lost2FAContext.useActorRef();
    const sendingCodeFailed = Lost2FAContext.useSelector(selectEmailSendingFailed);
    const canRetry = Lost2FAContext.useSelector(selectCanRetrySending);
    const awaitingCode = Lost2FAContext.useSelector(selectEmailAwaitingCode);

    const { sendStepLoad } = useLost2FATelemetry();
    // Once, the first time the code was sent: sending again after a failure stays on the same step
    const stepLoadSent = useRef(false);
    useEffect(() => {
        if (sendingCodeFailed || stepLoadSent.current) {
            return;
        }
        stepLoadSent.current = true;
        sendStepLoad('verify ownership with email');
    }, [sendingCodeFailed]);

    if (sendingCodeFailed) {
        return (
            <>
                {heading}
                <layout.Body>
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
                    <Button
                        size="large"
                        fullWidth
                        onClick={() => actorRef.send({ type: 'lost2FA.otherMethodRequested' })}
                    >
                        {c('Action').t`Try another way`}
                    </Button>
                </layout.Body>
            </>
        );
    }

    if (!awaitingCode) {
        return (
            <>
                {heading}
                <layout.Body>
                    <Loader />
                </layout.Body>
            </>
        );
    }

    return (
        <>
            {heading}
            <layout.Body>
                <VerifyCodeForm method="email" />
            </layout.Body>
        </>
    );
};
