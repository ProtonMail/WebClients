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
import { InternalAddressGeneration } from '@proton/components/containers/login/interface';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { persistSessionWithPassword } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getValidatedApp } from '@proton/shared/lib/authentication/sessionForkValidation';
import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import { PASSWORD_CHANGE_MESSAGE_TYPE, sendMessageToTabs } from '@proton/shared/lib/helpers/crossTab';
import { UserType } from '@proton/shared/lib/interfaces';
import { getInternalAddressSetupMode, handleInternalAddressGeneration } from '@proton/shared/lib/keys';
import { PROTON_DEFAULT_THEME } from '@proton/shared/lib/themes/themes';

import GenerateInternalAddressStep from '../login/GenerateInternalAddressStep';
import Footer from '../public/Footer';
import Layout from '../public/Layout';
import Main from '../public/Main';
import SupportDropdown from '../public/SupportDropdown';
import { getToAppName } from '../public/helper';

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

    const handleToApp = (toApp: APP_NAMES) => {
        document.location.assign(getAppHref('/', toApp, authentication.getLocalID()));
    };

    useEffect(() => {
        return () => {
            generateInternalAddressRef.current = undefined;
        };
    }, []);

    useEffect(() => {
        const run = async () => {
            const searchParams = new URLSearchParams(window.location.search);
            const toApp = getValidatedApp(searchParams.get('app') || '');

            if (!toApp) {
                return handleBack();
            }

            const [user, addresses, domains] = await Promise.all([
                getUser(),
                getAddresses(),
                silentApi<{ Domains: string[] }>(queryAvailableDomains()).then(({ Domains }) => Domains),
            ]);

            if (user.Type !== UserType.EXTERNAL) {
                return handleToApp(toApp);
            }

            // Special case to reset the user's theme since it's logged in at this point. Does not care about resetting it back since it always redirects back to the application.
            setTheme(PROTON_DEFAULT_THEME);

            // Stop the event manager since we're setting a new password (and it'd automatically log out) and we refresh once we're done
            stop();
            toAppRef.current = toApp;
            generateInternalAddressRef.current = {
                externalEmailAddress: addresses?.[0],
                availableDomains: domains,
                setup: getInternalAddressSetupMode({
                    User: user,
                    loginPassword: undefined,
                    keyPassword: authentication.getPassword(),
                }),
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

    const generateInternalAddress = generateInternalAddressRef.current;
    const externalEmailAddress = generateInternalAddress?.externalEmailAddress?.Email;

    if (!generateInternalAddress) {
        throw new Error('Missing dependencies');
    }

    return (
        <Layout hasDecoration={false}>
            <Main>
                <GenerateInternalAddressStep
                    onBack={handleBack}
                    api={silentApi}
                    toAppName={toAppName}
                    availableDomains={generateInternalAddress.availableDomains}
                    externalEmailAddress={externalEmailAddress}
                    setup={generateInternalAddress.setup}
                    onSubmit={async (payload) => {
                        try {
                            const keyPassword = await handleInternalAddressGeneration({
                                api: silentApi,
                                setup: payload.setup,
                                domain: payload.domain,
                                username: payload.username,
                            });

                            const user = await getUser();
                            authentication.setPassword(keyPassword);
                            const localID = authentication.getLocalID();
                            await persistSessionWithPassword({
                                api: silentApi,
                                keyPassword,
                                User: user,
                                UID: authentication.getUID(),
                                LocalID: localID,
                                persistent: authentication.getPersistent(),
                            });
                            sendMessageToTabs(PASSWORD_CHANGE_MESSAGE_TYPE, { localID, status: true });

                            handleToApp(toApp);
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
