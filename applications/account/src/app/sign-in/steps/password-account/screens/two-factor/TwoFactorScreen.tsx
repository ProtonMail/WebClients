import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tabs } from '@proton/components/components/tabs/Tabs';
import isTruthy from '@proton/utils/isTruthy';

import { SignInStepLayout } from '../../../../components/SignInStepLayout';
import { PasswordAccountContext } from '../../PasswordAccountContext';
import { selectFido2, selectTwoFactorTypes } from '../../state-machine/passwordAccountStateMachine';
import { Fido2Form } from './Fido2Form';
import { TotpForm } from './TotpForm';

export const TwoFactorScreen = () => {
    const actorRef = PasswordAccountContext.useActorRef();
    const fido2 = PasswordAccountContext.useSelector(selectFido2);
    const twoFactorTypes = PasswordAccountContext.useSelector(selectTwoFactorTypes);
    const [tabIndex, setTabIndex] = useState(0);

    const onLost2FAClick = () => actorRef.send({ type: 'lostTwoFactor.opened' });

    return (
        <SignInStepLayout
            title={c('Title').t`Two-factor authentication`}
            onBack={() => actorRef.send({ type: 'decision.back' })}
        >
            <Tabs
                fullWidth
                value={tabIndex}
                onChange={setTabIndex}
                tabs={[
                    twoFactorTypes.fido2 &&
                        fido2 && {
                            title: c('fido2: Label').t`Security key`,
                            content: (
                                <>
                                    <Fido2Form fido2={fido2} />
                                    <Button size="large" onClick={onLost2FAClick} fullWidth className="mt-2">
                                        {c('Action').t`I don't have my key`}
                                    </Button>
                                </>
                            ),
                        },
                    twoFactorTypes.totp && {
                        title: c('Label').t`Authenticator app`,
                        content: (
                            <>
                                <TotpForm />
                                <Button size="large" onClick={onLost2FAClick} fullWidth className="mt-2">
                                    {c('Action').t`I don't have my 2FA device`}
                                </Button>
                            </>
                        ),
                    },
                ].filter(isTruthy)}
            />
        </SignInStepLayout>
    );
};
