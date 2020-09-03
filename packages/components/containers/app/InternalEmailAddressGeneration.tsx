import React, { useState } from 'react';
import { c } from 'ttag';
import { APPS } from 'proton-shared/lib/constants';
import { Address } from 'proton-shared/lib/interfaces';

import { ProtonLogo, useAppLink } from '../../components';
import { useApi, useAuthentication, useConfig } from '../../hooks';

import { AccountSupportDropdown } from '../heading';
import AccountPublicLayout, { Props as AccountProps } from '../signup/AccountPublicLayout';
import AccountGenerateInternalAddressContainer from '../login/AccountGenerateInternalAddressContainer';

interface Props {
    children: React.ReactNode;
    externalEmailAddress?: Address;
}

const AppAccountPublicLayoutWrapper = ({ children, ...rest }: AccountProps) => {
    return (
        <AccountPublicLayout
            center={<ProtonLogo />}
            right={
                <AccountSupportDropdown noCaret className="link">
                    {c('Action').t`Need help?`}
                </AccountSupportDropdown>
            }
            {...rest}
        >
            {children}
        </AccountPublicLayout>
    );
};

const InternalEmailAddressGeneration = ({ children, externalEmailAddress }: Props) => {
    const { APP_NAME } = useConfig();
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const goToApp = useAppLink();
    const authentication = useAuthentication();

    const [needsSetup, setNeedsSetup] = useState(() => !!externalEmailAddress);

    if (!needsSetup || !externalEmailAddress) {
        return <>{children}</>;
    }

    const emailAddress = externalEmailAddress.Email || '';

    const handleBack = () => {
        return goToApp('/', APPS.PROTONACCOUNT);
    };

    const handleDone = async () => {
        setNeedsSetup(false);
    };

    return (
        <AccountGenerateInternalAddressContainer
            Layout={AppAccountPublicLayoutWrapper}
            externalEmailAddress={emailAddress}
            onDone={handleDone}
            onBack={handleBack}
            api={silentApi}
            toApp={APP_NAME}
            keyPassword={authentication.getPassword()}
        />
    );
};

export default InternalEmailAddressGeneration;
