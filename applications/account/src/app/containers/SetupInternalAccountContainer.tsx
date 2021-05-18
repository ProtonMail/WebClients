import React, { useEffect, useRef, useState } from 'react';
import { c } from 'ttag';
import {
    AuthenticatedBugModal,
    DropdownMenuButton,
    Icon,
    LoaderPage,
    StandardLoadErrorPage,
    useApi,
    useAppLink,
    useAuthentication,
    useErrorHandler,
    useModals,
    useTheme,
} from 'react-components';
import { ThemeTypes } from 'proton-shared/lib/themes/themes';
import { queryAddresses } from 'proton-shared/lib/api/addresses';
import { Address } from 'proton-shared/lib/interfaces';
import { queryAvailableDomains } from 'proton-shared/lib/api/domains';
import { handleCreateInternalAddressAndKey } from 'proton-shared/lib/keys';
import { getHasOnlyExternalAddresses } from 'proton-shared/lib/helpers/address';
import { getAppName } from 'proton-shared/lib/apps/helper';
import { APP_NAMES, APPS } from 'proton-shared/lib/constants';
import { getValidatedApp } from 'proton-shared/lib/authentication/sessionForkValidation';

import { getToAppName } from '../public/helper';
import GenerateInternalAddressStep, { InternalAddressGeneration } from '../login/GenerateInternalAddressStep';
import Main from '../public/Main';
import Layout from '../public/Layout';
import Footer from '../public/Footer';
import SupportDropdown from '../public/SupportDropdown';

const SetupSupportDropdown = () => {
    const { createModal } = useModals();

    const handleBugReportClick = () => {
        createModal(<AuthenticatedBugModal />);
    };

    return (
        <SupportDropdown>
            <DropdownMenuButton className="text-left" onClick={handleBugReportClick}>
                <Icon name="report-bug" className="mr0-5" />
                {c('Action').t`Report a problem`}
            </DropdownMenuButton>
        </SupportDropdown>
    );
};

const SetupInternalAccountContainer = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const errorHandler = useErrorHandler();
    const goToApp = useAppLink();
    const toAppRef = useRef<APP_NAMES | null>(null);
    const authentication = useAuthentication();
    const [, setTheme] = useTheme();

    const generateInternalAddressRef = useRef<InternalAddressGeneration | undefined>(undefined);

    const handleBack = () => {
        goToApp('/');
    };

    useEffect(() => {
        return () => {
            generateInternalAddressRef.current = undefined;
        };
    }, []);

    useEffect(() => {
        const run = async () => {
            const searchParams = new URLSearchParams(window.location.search);
            const app = getValidatedApp(searchParams.get('app') || '');

            if (!app) {
                return handleBack();
            }

            const [addresses, domains] = await Promise.all([
                silentApi<{ Addresses: Address[] }>(queryAddresses()).then(({ Addresses }) => Addresses),
                silentApi<{ Domains: string[] }>(queryAvailableDomains()).then(({ Domains }) => Domains),
            ]);

            if (!getHasOnlyExternalAddresses(addresses)) {
                return handleBack();
            }

            // Special case to reset the user's theme since it's logged in at this point. Does not care about resetting it back since it always redirects back to the application.
            setTheme(ThemeTypes.Default);

            toAppRef.current = app;
            generateInternalAddressRef.current = {
                externalEmailAddress: addresses[0],
                availableDomains: domains,
                keyPassword: authentication.getPassword(),
                api: silentApi,
                onDone: async () => {
                    goToApp('/', app);
                },
                revoke: () => {},
            };
            setLoading(false);
        };

        run()
            .then(() => {
                setLoading(false);
            })
            .catch((e) => {
                errorHandler(e);
                setError(true);
            });
    }, []);

    if (error) {
        return <StandardLoadErrorPage />;
    }

    if (loading) {
        return <LoaderPage />;
    }

    const toApp = toAppRef.current!;
    const toAppName = getToAppName(toApp);
    const mailAppName = getAppName(APPS.PROTONMAIL);

    const generateInternalAddress = generateInternalAddressRef.current;
    const externalEmailAddress = generateInternalAddress?.externalEmailAddress?.Email || '';

    if (!generateInternalAddress) {
        throw new Error('Missing dependencies');
    }

    return (
        <Layout toApp={toApp} hasLanguageSelect={false}>
            <Main>
                <GenerateInternalAddressStep
                    api={silentApi}
                    mailAppName={mailAppName}
                    toAppName={toAppName}
                    availableDomains={generateInternalAddress.availableDomains}
                    externalEmailAddress={externalEmailAddress}
                    onBack={() => {
                        handleBack();
                    }}
                    onSubmit={async (payload) => {
                        try {
                            await handleCreateInternalAddressAndKey({
                                api: generateInternalAddress.api,
                                keyPassword: generateInternalAddress.keyPassword,
                                domain: payload.domain,
                                username: payload.username,
                            });
                            await generateInternalAddress.onDone();
                        } catch (e) {
                            errorHandler(e);
                            handleBack();
                        }
                    }}
                />
                <Footer>
                    <SetupSupportDropdown />
                </Footer>
            </Main>
        </Layout>
    );
};

export default SetupInternalAccountContainer;
