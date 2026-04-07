import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tabs } from '@proton/components';
import type { AuthTypes } from '@proton/components/containers/login/interface';
import type { Fido2Data, Fido2Response } from '@proton/shared/lib/authentication/interface';
import { useFlag } from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';

import Fido2Form from './Fido2Form';
import LoginTOTPForm, { LoginTOTPFormWithRecoveryCodeInputForm } from './LoginTOTPForm';

interface Props {
    onSubmit: (data: { type: 'code'; payload: string } | { type: 'fido2'; payload: Fido2Data }) => Promise<void>;
    fido2?: Fido2Response | null;
    authTypes: AuthTypes;
    onLost2FAClick: () => void;
}

const TwoFactorStep = ({ onSubmit, fido2, authTypes, onLost2FAClick }: Props) => {
    const [tabIndex, setTabIndex] = useState(0);
    const unauthLost2FAEnabled = useFlag('UnauthLost2FA');

    return (
        <>
            <Tabs
                fullWidth
                value={tabIndex}
                onChange={setTabIndex}
                tabs={[
                    authTypes.twoFactor.fido2 &&
                        fido2 && {
                            title: c('fido2: Label').t`Security key`,
                            content: (
                                <>
                                    <Fido2Form
                                        onSubmit={(payload) => onSubmit({ type: 'fido2', payload })}
                                        fido2={fido2}
                                    />
                                    {unauthLost2FAEnabled ? (
                                        <Button size="large" onClick={onLost2FAClick} fullWidth className="mt-2">
                                            {c('Action').t`I don't have my key`}
                                        </Button>
                                    ) : null}
                                </>
                            ),
                        },
                    authTypes.twoFactor.totp && {
                        title: c('Label').t`Authenticator app`,
                        content: (
                            <>
                                {unauthLost2FAEnabled ? (
                                    <>
                                        <LoginTOTPForm onSubmit={(payload) => onSubmit({ type: 'code', payload })} />
                                        <Button size="large" onClick={onLost2FAClick} fullWidth className="mt-2">
                                            {c('Action').t`I don't have my 2FA device`}
                                        </Button>
                                    </>
                                ) : (
                                    <LoginTOTPFormWithRecoveryCodeInputForm
                                        onSubmit={(payload) => onSubmit({ type: 'code', payload })}
                                    />
                                )}
                            </>
                        ),
                    },
                ].filter(isTruthy)}
            />
        </>
    );
};

export default TwoFactorStep;
