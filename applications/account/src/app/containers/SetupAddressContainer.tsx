import { useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

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
    useGetUser,
    useModalState,
    useTheme,
} from '@proton/components';
import { AddressGeneration } from '@proton/components/containers/login/interface';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { getToAppName } from '@proton/shared/lib/authentication/apps';
import { persistSessionWithPassword } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getValidatedApp } from '@proton/shared/lib/authentication/sessionForkValidation';
import { APPS, APP_NAMES, SSO_PATHS } from '@proton/shared/lib/constants';
import { PASSWORD_CHANGE_MESSAGE_TYPE, sendMessageToTabs } from '@proton/shared/lib/helpers/crossTab';
import { User } from '@proton/shared/lib/interfaces';
import {
    getAddressGenerationSetup,
    getDecryptedSetupBlob,
    getRequiresAddressSetup,
    handleAddressGeneration,
} from '@proton/shared/lib/keys';
import { PROTON_DEFAULT_THEME } from '@proton/shared/lib/themes/themes';
import noop from '@proton/utils/noop';

import GenerateAddressStep from '../login/GenerateAddressStep';
import Footer from '../public/Footer';
import Layout from '../public/Layout';
import Main from '../public/Main';
import SupportDropdown from '../public/SupportDropdown';

interface From {
    type: 'settings' | 'app' | 'switch';
    app: APP_NAMES;
}

const defaultSwitchResult = { type: 'switch', app: APPS.PROTONACCOUNT } as const;

const getApp = (app: string) => {
    if (app === APPS.PROTONVPN_SETTINGS) {
        return app;
    }
    return getValidatedApp(app);
};

const getValidatedFrom = ({ from, type, user }: { type: string; from: string; user: User }): From => {
    if (!from || from === 'switch') {
        return defaultSwitchResult;
    }
    const validatedApp = getApp(from);
    if (!validatedApp) {
        return defaultSwitchResult;
    }
    if (getRequiresAddressSetup(validatedApp, user)) {
        return defaultSwitchResult;
    }
    const validatedType = type === 'settings' ? 'settings' : 'app';
    return { app: validatedApp, type: validatedType };
};

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

const SetupAddressContainer = () => {
    const history = useHistory();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ message?: string } | null>(null);
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const errorHandler = useErrorHandler();
    const toAppRef = useRef<APP_NAMES | null>(null);
    const fromAppRef = useRef<From>(defaultSwitchResult);
    const authentication = useAuthentication();
    const getUser = useGetUser();
    const [, setTheme] = useTheme();

    const generateAddressRef = useRef<AddressGeneration | undefined>(undefined);

    const handleBack = () => {
        const from = fromAppRef.current;
        if (from.type === 'switch') {
            document.location.assign(getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT));
            return;
        }
        let url = '';
        const localID = authentication.getLocalID();
        if (from.app === APPS.PROTONVPN_SETTINGS || from.type === 'settings') {
            url = getAppHref(`/${getSlugFromApp(from.app)}/dashboard`, APPS.PROTONACCOUNT, localID);
        } else {
            url = getAppHref('/', from.app, localID);
        }
        document.location.assign(url);
    };

    const handleToApp = (toApp: APP_NAMES) => {
        document.location.assign(getAppHref('/', toApp, authentication.getLocalID()));
    };

    useEffect(() => {
        return () => {
            generateAddressRef.current = undefined;
        };
    }, []);

    useEffect(() => {
        const run = async () => {
            const user = await getUser();

            const searchParams = new URLSearchParams(location.search);
            const validatedToApp = getApp(searchParams.get('to') || searchParams.get('app') || '');
            fromAppRef.current = getValidatedFrom({
                from: searchParams.get('from') || '',
                type: searchParams.get('type') || '',
                user,
            });

            if (!validatedToApp) {
                handleBack();
                return new Promise(noop);
            }

            if (!getRequiresAddressSetup(validatedToApp, user)) {
                handleToApp(validatedToApp);
                return new Promise(noop);
            }

            const hash = location.hash.slice(1);
            const blob = hash ? await getDecryptedSetupBlob(silentApi, hash).catch(noop) : undefined;

            history.replace({ ...location, hash: '' });

            // Special case to reset the user's theme since it's logged in at this point. Does not care about resetting it back since it always redirects back to the application.
            setTheme(PROTON_DEFAULT_THEME);

            // Stop the event manager since we're setting a new password (and it'd automatically log out) and we refresh once we're done
            stop();
            toAppRef.current = validatedToApp;
            generateAddressRef.current = await getAddressGenerationSetup({
                user,
                api: silentApi,
                loginPassword: blob?.loginPassword,
                keyPassword: authentication.getPassword(),
            });
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

    const generateAddress = generateAddressRef.current;

    if (!generateAddress) {
        throw new Error('Missing dependencies');
    }

    return (
        <Layout hasDecoration={false}>
            <Main>
                <GenerateAddressStep
                    onBack={handleBack}
                    api={silentApi}
                    toAppName={toAppName}
                    data={generateAddress}
                    onSubmit={async (payload) => {
                        try {
                            const keyPassword = await handleAddressGeneration({
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
                                trusted: authentication.getTrusted(),
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

export default SetupAddressContainer;
