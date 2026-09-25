import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { IcArrowWithinSquare } from '@proton/icons/icons/IcArrowWithinSquare';
import { getSupportContactURL } from '@proton/shared/lib/helpers/url';

import { Lost2FAContext } from '../Lost2FAContext';
import { Lost2FAStepLayout } from '../Lost2FAStepLayout';
import { selectLost2FAUsername } from '../state-machine/lost2FAStateMachine';
import { useLost2FATelemetry } from '../useLost2FATelemetry';

export const NoMethodsScreen = () => {
    const username = Lost2FAContext.useSelector(selectLost2FAUsername);
    const { sendStepLoad } = useLost2FATelemetry();
    useEffect(() => {
        sendStepLoad('no method to disable 2fa');
    }, []);

    const { send } = Lost2FAContext.useActorRef();

    return (
        <Lost2FAStepLayout title={c('Title').t`Disable two-factor authentication?`}>
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
            <Button size="large" fullWidth onClick={() => send({ type: 'lost2FA.passwordResetRequested' })}>
                {c('Action').t`Recover account`}
            </Button>
        </Lost2FAStepLayout>
    );
};
