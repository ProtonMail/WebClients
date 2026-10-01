import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import type { SignInScreen, SignInScreenProps } from '../../../../../../routes/signInRoute';
import { useSignInProps } from '../../../../../../wizard/SignInProvider';
import { getDisableTwoFactorTitle } from '../../DisableTwoFactorTitle';
import { Lost2FAContext } from '../../Lost2FAContext';
import { Lost2FAUsername } from '../../Lost2FAUsername';
import { selectPhoneAwaitingCode, selectSendingPhoneCode } from '../../state-machine/lost2FAStateMachine';
import { useLost2FATelemetry } from '../../useLost2FATelemetry';
import { VerifyCodeForm } from '../VerifyCodeForm';

/** The code is only sent to the recovery phone once the user asks, since it may cost them. */
export const VerifyOwnershipWithPhoneScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout } = useSignInProps();
    const heading = <layout.Header title={getDisableTwoFactorTitle()} subTitle={<Lost2FAUsername />} onBack={onBack} />;
    const actorRef = Lost2FAContext.useActorRef();
    const sendingCode = Lost2FAContext.useSelector(selectSendingPhoneCode);
    const awaitingCode = Lost2FAContext.useSelector(selectPhoneAwaitingCode);

    const { sendStepLoad } = useLost2FATelemetry();
    useEffect(() => {
        sendStepLoad('verify ownership with phone');
    }, []);

    if (awaitingCode) {
        return (
            <>
                {heading}
                <layout.Body>
                    <VerifyCodeForm method="phone" />
                </layout.Body>
            </>
        );
    }

    return (
        <>
            {heading}
            <layout.Body>
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
            </layout.Body>
        </>
    );
};
