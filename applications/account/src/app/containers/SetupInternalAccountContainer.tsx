import { useEffect, useRef, useState } from 'react';
import { c } from 'ttag';
import {
    AuthenticatedBugModal,
    DropdownMenuButton,
    Icon,
    LoaderPage,
    StandardLoadErrorPage,
    useApi,
    useAuthentication,
    useErrorHandler,
    useGetAddresses,
    useGetUser,
    useModalState,
    useTheme,
} from '@proton/components';
import { ThemeTypes } from '@proton/shared/lib/themes/themes';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { handleCreateInternalAddressAndKey } from '@proton/shared/lib/keys';
import { getAppHref, getAppName } from '@proton/shared/lib/apps/helper';
import { APP_NAMES, APPS } from '@proton/shared/lib/constants';
import { getValidatedApp } from '@proton/shared/lib/authentication/sessionForkValidation';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { UserType } from '@proton/shared/lib/interfaces';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';

import { getToAppName } from '../public/helper';
import GenerateInternalAddressStep, { InternalAddressGeneration } from '../login/GenerateInternalAddressStep';
import Main from '../public/Main';
import Layout from '../public/Layout';
import Footer from '../public/Footer';
import SupportDropdown from '../public/SupportDropdown';

const SetupSupportDropdown = () => {
    const [authenticatedBugReportModal, setAuthenticatedBugReportModal, render] = useModalState();

    const handleBugReportClick = () => {
        setAuthenticatedBugReportModal(true);
    };

    return (
        <>
            {render && <AuthenticatedBugModal {...authenticatedBugReportModal} />}
            <SupportDropdown>
                <DropdownMenuButton className="text-left" onClick={handleBugReportClick}>
                    <Icon name="bug" className="mr0-5" />
                    {c('Action').t`Report a problem`}
                </DropdownMenuButton>
            </SupportDropdown>
        </>
    );
};

const SetupInternalAccountContainer = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ message?: string } | null>(null);
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const errorHandler = useErrorHandler();
    const toAppRef = useRef<APP_NAMES | null>(null);
    const authentication = useAuthentication();
    const getAddresses = useGetAddresses();
    const getUser = useGetUser();
    const [, setTheme] = useTheme();

    const generateInternalAddressRef = useRef<InternalAddressGeneration | undefined>(undefined);

    const handleBack = () => {
        // Always forces a refresh for the theme
        document.location.assign(
            getAppHref(`/${getSlugFromApp(APPS.PROTONVPN_SETTINGS)}`, APPS.PROTONACCOUNT, authentication.getLocalID())
        );
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

            const [user, addresses, domains] = await Promise.all([
                getUser(),
                getAddresses(),
                silentApi<{ Domains: string[] }>(queryAvailableDomains()).then(({ Domains }) => Domains),
            ]);

            if (user.Type !== UserType.EXTERNAL) {
                return handleBack();
            }

            // Special case to reset the user's theme since it's logged in at this point. Does not care about resetting it back since it always redirects back to the application.
            setTheme(ThemeTypes.Default);

            toAppRef.current = app;
            generateInternalAddressRef.current = {
                externalEmailAddress: addresses?.[0],
                availableDomains: domains,
                keyPassword: authentication.getPassword(),
                api: silentApi,
                onDone: async () => {
                    document.location.assign(getAppHref('/', app, authentication.getLocalID()));
                },
                revoke: () => {},
            };
            setLoading(false);
        };

        run()
            .then(() => {
                setLoading(false);
            })
            .catch((error) => {
                errorHandler(error);
                setError({
                    message: getApiErrorMessage(error) || error?.message,
                });
            });
    }, []);

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    if (loading) {
        return <LoaderPage />;
    }

    const toApp = toAppRef.current!;
    const toAppName = getToAppName(toApp);
    const mailAppName = getAppName(APPS.PROTONMAIL);

    const generateInternalAddress = generateInternalAddressRef.current;
    const externalEmailAddress = generateInternalAddress?.externalEmailAddress?.Email;

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
                        } catch (e: any) {
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
