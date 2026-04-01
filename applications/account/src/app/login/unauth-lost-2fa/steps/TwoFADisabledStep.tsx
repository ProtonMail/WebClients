import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';

import { useUnauthLost2FA } from '../UnauthedLost2FAContainer';

export const TwoFADisabledStep = () => {
    const { useUnauthLost2FAActorRef } = useUnauthLost2FA();
    const actorRef = useUnauthLost2FAActorRef();
    const { send } = actorRef;

    return (
        <div>
            <div className="mb-4 border border-weak flex items-start gap-2 p-3 rounded flex-nowrap">
                <IcCheckmarkCircleFilled size={4} className="color-success mt-0.5 shrink-0" />
                <span>{c('Info').t`You will not be asked for a one-time code or a security key.`}</span>
            </div>
            <div className="mb-4">{c('Info').t`You can now sign in to your account again.`}</div>
            <Button size="large" fullWidth color="norm" onClick={() => send({ type: 'signin to continue' })}>
                {c('Action').t`Continue to sign in`}
            </Button>
        </div>
    );
};
