import { useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import {
    AuthenticatedBugModal,
    DropdownMenuButton,
    Icon,
    StandardLoadErrorPage,
    createPreAuthKTVerifier,
    useApi,
    useAuthentication,
    useErrorHandler,
    useGetUser,
    useModalState,
    useTheme,
} from '@proton/components';
import useKTActivation from '@proton/components/containers/keyTransparency/useKTActivation';
import { AddressGeneration } from '@proton/components/containers/login/interface';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp, stripSlugFromPathname } from '@proton/shared/lib/apps/slugHelper';
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
import noop from '@proton/utils/noop';

import AccountLoaderPage from '../content/AccountLoaderPage';
import GenerateAddressStep from '../login/GenerateAddressStep';
import Footer from '../public/Footer';
import Layout from '../public/Layout';
import Main from '../public/Main';
import SupportDropdown from '../public/SupportDropdown';

interface From {
    type: 'settings' | 'app' | 'switch';
    app: APP_NAMES;
    path: string;
}

interface To {
    type: 'settings' | 'app';
    app: APP_NAMES;
    path: string;
}

const defaultToResult = { type: 'app', app: APPS.PROTONMAIL, path: '/' } as const;
const defaultFromResult = { type: 'switch', app: APPS.PROTONACCOUNT, path: '/dashboard' } as const;

const getApp = (app: string) => {
    if (app === APPS.PROTONVPN_SETTINGS || app === APPS.PROTONPASS) {
        return app;
    }
    return getValidatedApp(app);
};

const getValidatedTo = ({ to, type, path }: { type: string; to: APP_NAMES; path: string }): To => {
    if (!to) {
        return defaultToResult;
    }
    const validatedType = type === 'settings' ? 'settings' : 'app';
    const validatedPath = path.startsWith('/') ? path : defaultToResult.path;
    return { app: to, type: validatedType, path: validatedPath };
};

const getValidatedFrom = ({
    from,
    type,
    user,
    path,
}: {
    type: string;
    from: string;
    user: User;
    path: string;
}): From => {
    if (!from || from === 'switch') {
        return defaultFromResult;
    }
    const validatedApp = getApp(from);
    if (!validatedApp) {
        return defaultFromResult;
    }
    if (getRequiresAddressSetup(validatedApp, user)) {
        return defaultFromResult;
    }
    const validatedType = type === 'settings' ? 'settings' : 'app';
    const validatedPath = path.startsWith('/') ? path : defaultFromResult.path;
    return { app: validatedApp, type: validatedType, path: validatedPath };
};

const SetupSupportDropdown = () => {
    const [authenticatedBugReportModal, setAuthenticatedBugReportModal, render] = useModalState();

    const handleBugReportClick = () => {
        setAuthenticatedBugReportModal(true);
    };

    return (
        <>
            {render && <AuthenticatedBugModal {...authenticatedBugReportModal} />}
            <SupportDropdown buttonClassName="mx-auto">
                <DropdownMenuButton className="text-left" onClick={handleBugReportClick}>
                    <Icon name="bug" className="mr-2" />
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
    const toRef = useRef<To>(defaultToResult);
    const fromRef = useRef<From>(defaultFromResult);
    const authentication = useAuthentication();
    const getUser = useGetUser();
    const { setThemeSetting } = useTheme();
    const ktActivation = useKTActivation();

    const generateAddressRef = useRef<AddressGeneration | undefined>(undefined);

    const handleBack = () => {
        const from = fromRef.current;
        if (from.type === 'switch') {
            document.location.assign(getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT));
            return;
        }
        let url = '';
        const localID = authentication.getLocalID();
        if (from.app === APPS.PROTONVPN_SETTINGS || from.app === APPS.PROTONPASS || from.type === 'settings') {
            url = getAppHref(
                `/${getSlugFromApp(from.app)}${stripSlugFromPathname(from.path)}`,
                APPS.PROTONACCOUNT,
                localID
            );
        } else {
            url = getAppHref('/', from.app, localID);
        }
        document.location.assign(url);
    };

    const handleToApp = () => {
        const { app, path, type } = toRef.current;
        if (type === 'app') {
            document.location.assign(getAppHref('/', app, authentication.getLocalID()));
        } else {
            document.location.assign(getAppHref(path, APPS.PROTONACCOUNT, authentication.getLocalID()));
        }
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

            fromRef.current = getValidatedFrom({
                from: searchParams.get('from') || '',
                type: searchParams.get('from-type') || searchParams.get('type') || '',
                path: searchParams.get('from-path') || '',
                user,
            });

            if (!validatedToApp) {
                handleBack();
                return new Promise(noop);
            }

            toRef.current = getValidatedTo({
                to: validatedToApp,
                type: searchParams.get('to-type') || '',
                path: searchParams.get('to-path') || '',
            });

            if (!getRequiresAddressSetup(validatedToApp, user)) {
                handleToApp();
                return new Promise(noop);
            }

            const hash = location.hash.slice(1);
            const blob = hash ? await getDecryptedSetupBlob(silentApi, hash).catch(noop) : undefined;

            history.replace({ ...location, hash: '' });

            // Special case to reset the user's theme since it's logged in at this point. Does not care about resetting it back since it always redirects back to the application.
            setThemeSetting();

            // Stop the event manager since we're setting a new password (and it'd automatically log out) and we refresh once we're done
            stop();
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
        return <AccountLoaderPage />;
    }

    const to = toRef.current!;
    const toAppName = getToAppName(to.app);

    const generateAddress = generateAddressRef.current;

    if (!generateAddress) {
        const error: any = new Error('Missing dependencies');
        error.trace = false;
        throw error;
    }

    return (
        <Layout onBack={handleBack} hasDecoration={false}>
            <Main>
                <GenerateAddressStep
                    onBack={handleBack}
                    api={silentApi}
                    toAppName={toAppName}
                    data={generateAddress}
                    onSubmit={async (payload) => {
                        try {
                            const { preAuthKTVerify, preAuthKTCommit } = createPreAuthKTVerifier(
                                ktActivation,
                                normalApi
                            );

                            const keyPassword = await handleAddressGeneration({
                                api: silentApi,
                                setup: payload.setup,
                                domain: payload.domain,
                                username: payload.username,
                                preAuthKTVerify,
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

                            await preAuthKTCommit(user.ID);

                            handleToApp();
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
