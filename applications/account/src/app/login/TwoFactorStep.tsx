import { useState } from 'react';

import { c } from 'ttag';

import { Tabs } from '@proton/components';
import type { AuthTypes } from '@proton/components/containers/login/interface';
import type { Fido2Data, Fido2Response } from '@proton/shared/lib/authentication/interface';
import isTruthy from '@proton/utils/isTruthy';

import Fido2Form from './Fido2Form';
import LoginTOTPForm from './LoginTOTPForm';

interface Props {
    onSubmit: (data: { type: 'code'; payload: string } | { type: 'fido2'; payload: Fido2Data }) => Promise<void>;
    fido2?: Fido2Response | null;
    authTypes: AuthTypes;
}

const TwoFactorStep = ({ onSubmit, fido2, authTypes }: Props) => {
    const [tabIndex, setTabIndex] = useState(0);
    return (
        <Tabs
            fullWidth
            value={tabIndex}
            onChange={setTabIndex}
            tabs={[
                authTypes.fido2 &&
                    fido2 && {
                        title: c('fido2: Label').t`Security key`,
                        content: (
                            <Fido2Form onSubmit={(payload) => onSubmit({ type: 'fido2', payload })} fido2={fido2} />
                        ),
                    },
                authTypes.totp && {
                    title: c('Label').t`Authenticator app`,
                    content: <LoginTOTPForm onSubmit={(payload) => onSubmit({ type: 'code', payload })} />,
                },
            ].filter(isTruthy)}
        />
    );
};

export default TwoFactorStep;
