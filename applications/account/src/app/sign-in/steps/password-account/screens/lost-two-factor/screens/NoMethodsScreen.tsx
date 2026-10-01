import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { IcArrowWithinSquare } from '@proton/icons/icons/IcArrowWithinSquare';
import { getSupportContactURL } from '@proton/shared/lib/helpers/url';

import type { SignInScreen, SignInScreenProps } from '../../../../../routes/signInRoute';
import { useSignInProps } from '../../../../../wizard/SignInProvider';
import { getDisableTwoFactorTitle } from '../DisableTwoFactorTitle';
import { Lost2FAContext } from '../Lost2FAContext';
import { Lost2FAUsername } from '../Lost2FAUsername';
import { selectLost2FAUsername, selectSubmitting } from '../state-machine/lost2FAStateMachine';
import { useLost2FATelemetry } from '../useLost2FATelemetry';

export const NoMethodsScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout } = useSignInProps();
    const username = Lost2FAContext.useSelector(selectLost2FAUsername);
    // Recovering the account leaves the page, which stays up, loading, until the next one loads
    const resetting = Lost2FAContext.useSelector(selectSubmitting);
    const { sendStepLoad } = useLost2FATelemetry();
    useEffect(() => {
        sendStepLoad('no method to disable 2fa');
    }, []);

    const { send } = Lost2FAContext.useActorRef();

    return (
        <>
            <layout.Header title={getDisableTwoFactorTitle()} subTitle={<Lost2FAUsername />} onBack={onBack} />
            <layout.Body>
                <div className="mb-4">
                    {c('Info')
                        .t`Contact our Customer Support team to disable two-factor authentication for your account, or recover your account another way.`}
                </div>
                <ButtonLike
                    size="large"
                    fullWidth
                    color="norm"
                    as={Href}
                    href={getSupportContactURL({ topic: 'Login and Password', product: 'account', username })}
                    className="mb-2 flex justify-center items-center gap-2"
                >
                    {c('Action').t`Contact Support Center`}
                    <IcArrowWithinSquare />
                </ButtonLike>
                <Button
                    size="large"
                    fullWidth
                    loading={resetting}
                    onClick={() => send({ type: 'lost2FA.passwordResetRequested' })}
                >
                    {c('Action').t`Recover account`}
                </Button>
            </layout.Body>
        </>
    );
};
