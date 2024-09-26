import { useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import {
    AuthenticatedBugModal,
    DropdownMenuButton,
    Icon,
    StandardLoadErrorPage,
    useApi,
    useAuthentication,
    useErrorHandler,
    useEventManager,
    useGetUser,
    useKTActivation,
    useModalState,
    useTheme,
} from '@proton/components';
import type { AddressGeneration } from '@proton/components/containers/login/interface';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp, stripSlugFromPathname } from '@proton/shared/lib/apps/slugHelper';
import { getToAppName } from '@proton/shared/lib/authentication/apps';
import { getValidatedApp } from '@proton/shared/lib/authentication/fork/validation';
import mutatePassword from '@proton/shared/lib/authentication/mutate';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import type { User } from '@proton/shared/lib/interfaces';
import { createPreAuthKTVerifier } from '@proton/shared/lib/keyTransparency';
import {
    getAddressGenerationSetup,
    getDecryptedSetupBlob,
    getRequiresAddressSetup,
    handleCreateAddressAndKey,
    handleSetupAddressAndKey,
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

const defaultToResult: To = { type: 'app', app: APPS.PROTONMAIL, path: '/' };
const defaultFromResult: From = { type: 'switch', app: APPS.PROTONACCOUNT, path: '/dashboard' };

const getApp = (app: string) => {
    if (app === APPS.PROTONVPN_SETTINGS) {
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
    const toRef = useRef(defaultToResult);
    const fromRef = useRef(defaultFromResult);
    const authentication = useAuthentication();
    const { stop } = useEventManager();
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
        if (from.app === APPS.PROTONVPN_SETTINGS || from.type === 'settings') {
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
            const blob = hash
                ? await getDecryptedSetupBlob(authentication.getClientKey(), hash).catch(noop)
                : undefined;

            if (hash) {
                history.replace({ ...location, hash: '' });
            }

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
                    message: getNonEmptyErrorMessage(error),
                });
            });
    }, []);

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    if (loading) {
        return <AccountLoaderPage />;
    }

    const to = toRef.current;
    const toApp = to.app;
    const toAppName = getToAppName(toApp);

    const generateAddress = generateAddressRef.current;

    if (!generateAddress) {
        const error: any = new Error('Missing dependencies');
        error.trace = false;
        throw error;
    }

    return (
        <Layout onBack={handleBack} hasDecoration={false} toApp={toApp}>
            <Main>
                <GenerateAddressStep
                    onBack={handleBack}
                    api={silentApi}
                    toAppName={toAppName}
                    data={generateAddress}
                    onSubmit={async (payload) => {
                        try {
                            const { preAuthKTVerify, preAuthKTCommit } = createPreAuthKTVerifier(ktActivation);

                            const user = await getUser();

                            if (payload.setup.mode === 'setup') {
                                const keyPassword = await handleSetupAddressAndKey({
                                    username: payload.username,
                                    domain: payload.domain,
                                    api: silentApi,
                                    password: payload.setup.loginPassword,
                                    preAuthKTVerify,
                                    productParam: toApp,
                                });

                                await mutatePassword({
                                    authentication,
                                    keyPassword,
                                    clearKeyPassword: payload.setup.loginPassword,
                                    User: user,
                                    api: silentApi,
                                });
                            }

                            if (payload.setup.mode === 'create') {
                                await handleCreateAddressAndKey({
                                    username: payload.username,
                                    domain: payload.domain,
                                    api: silentApi,
                                    passphrase: payload.setup.keyPassword,
                                    preAuthKTVerify,
                                });
                            }

                            await preAuthKTCommit(user.ID, silentApi);

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
