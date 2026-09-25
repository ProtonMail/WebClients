import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';

import { Lost2FAContext } from '../Lost2FAContext';
import { Lost2FAStepLayout } from '../Lost2FAStepLayout';
import { useLost2FATelemetry } from '../useLost2FATelemetry';

export const TwoFADisabledScreen = () => {
    const { send } = Lost2FAContext.useActorRef();

    const { sendStepLoad } = useLost2FATelemetry();
    useEffect(() => {
        sendStepLoad('2fa-disabled');
    }, []);

    return (
        <Lost2FAStepLayout title={c('Title').t`Two-factor authentication disabled`} hasBack={false}>
            <div className="mb-4 border border-weak flex items-start gap-2 p-3 rounded flex-nowrap">
                <IcCheckmarkCircleFilled size={4} className="color-success mt-0.5 shrink-0" />
                <span>{c('Info').t`You will not be asked for a one-time code or a security key.`}</span>
            </div>
            <div className="mb-4">{c('Info').t`You can now sign in to your account again.`}</div>
            <Button size="large" fullWidth color="norm" onClick={() => send({ type: 'lost2FA.signInRequested' })}>
                {c('Action').t`Continue to sign in`}
            </Button>
        </Lost2FAStepLayout>
    );
};
