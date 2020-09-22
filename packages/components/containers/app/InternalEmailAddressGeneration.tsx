import React, { useState } from 'react';
import { c } from 'ttag';
import { APPS } from 'proton-shared/lib/constants';
import { Address } from 'proton-shared/lib/interfaces';
import { loadModels } from 'proton-shared/lib/models/helper';
import { AddressesModel } from 'proton-shared/lib/models';
import { noop } from 'proton-shared/lib/helpers/function';

import { ProtonLogo, useAppLink } from '../../components';
import { useApi, useAuthentication, useCache, useConfig, useEventManager } from '../../hooks';

import { AccountSupportDropdown } from '../heading';
import AccountPublicLayout, { Props as AccountProps } from '../signup/AccountPublicLayout';
import AccountGenerateInternalAddressContainer from '../login/AccountGenerateInternalAddressContainer';
import StandardLoadError from './StandardLoadError';

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
    const cache = useCache();
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const goToApp = useAppLink();
    const authentication = useAuthentication();
    const [fatalError, setFatalError] = useState(false);
    const { call } = useEventManager();

    const [needsSetup, setNeedsSetup] = useState(() => !!externalEmailAddress);

    if (!needsSetup || !externalEmailAddress) {
        return <>{children}</>;
    }

    const emailAddress = externalEmailAddress.Email || '';

    const handleBack = () => {
        return goToApp('/', APPS.PROTONACCOUNT);
    };

    const handleDone = async () => {
        try {
            await loadModels([AddressesModel], { api: silentApi, cache, useCache: false });
            await call().catch(noop);
            setNeedsSetup(false);
        } catch (e) {
            setFatalError(true);
        }
    };

    if (fatalError) {
        return <StandardLoadError />;
    }

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
