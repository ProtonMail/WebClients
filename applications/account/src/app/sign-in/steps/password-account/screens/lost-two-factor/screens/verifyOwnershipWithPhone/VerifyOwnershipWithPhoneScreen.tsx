import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { Lost2FAContext } from '../../Lost2FAContext';
import { Lost2FAStepLayout } from '../../Lost2FAStepLayout';
import { selectPhoneAwaitingCode } from '../../state-machine/lost2FAStateMachine';
import { useLost2FATelemetry } from '../../useLost2FATelemetry';
import { VerifyCodeForm } from '../VerifyCodeForm';

/** The code is only sent to the recovery phone once the user asks, since it may cost them. */
const VerifyOwnershipWithPhoneContent = () => {
    const actorRef = Lost2FAContext.useActorRef();
    const sendingCode = Lost2FAContext.useSelector((snapshot) =>
        snapshot.matches({ verifyOwnershipWithPhone: 'sendingCode' })
    );
    const awaitingCode = Lost2FAContext.useSelector(selectPhoneAwaitingCode);

    const { sendStepLoad } = useLost2FATelemetry();
    useEffect(() => {
        sendStepLoad('verify ownership with phone');
    }, []);

    if (awaitingCode) {
        return <VerifyCodeForm method="phone" />;
    }

    return (
        <>
            <p>{c('Info')
                .t`To help keep your account safe, we want to make sure it’s really you trying to sign in.`}</p>

            <p>{c('Info')
                .jt`${BRAND_NAME} will send a verification code to your recovery phone. Standard message rates may apply.`}</p>

            <Button
                size="large"
                color="norm"
                type="submit"
                fullWidth
                onClick={() => actorRef.send({ type: 'verification.codeRequested' })}
                loading={sendingCode}
                className="mt-6"
            >
                {c('Action').t`Send code`}
            </Button>

            <Button
                size="large"
                fullWidth
                className="mt-2"
                onClick={() => actorRef.send({ type: 'lost2FA.otherMethodRequested' })}
            >
                {c('Action').t`Verify another way`}
            </Button>
        </>
    );
};

export const VerifyOwnershipWithPhoneScreen = () => (
    <Lost2FAStepLayout title={c('Title').t`Disable two-factor authentication?`}>
        <VerifyOwnershipWithPhoneContent />
    </Lost2FAStepLayout>
);
