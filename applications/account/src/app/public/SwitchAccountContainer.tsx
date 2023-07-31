import { Fragment, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, CircleLoader, Scroll } from '@proton/atoms';
import {
    Alert,
    ConfirmSignOutModal,
    Icon,
    InlineLinkButton,
    Loader,
    OnLoginCallbackArguments,
    useApi,
    useErrorHandler,
    useModals,
    useNotifications,
} from '@proton/components';
import { startUnAuthFlow } from '@proton/components/containers/api/unAuthenticatedApi';
import { useLoading } from '@proton/hooks';
import { revoke } from '@proton/shared/lib/api/auth';
import { PersistedSessionWithLocalID } from '@proton/shared/lib/authentication/SessionInterface';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import {
    LocalSessionPersisted,
    getActiveSessions,
    resumeSession,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { removePersistedSession } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { APP_NAMES, BRAND_NAME } from '@proton/shared/lib/constants';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { getHasRecoveryMessage, removeDeviceRecovery } from '@proton/shared/lib/recoveryFile/deviceRecovery';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { MetaTags, useMetaTags } from '../useMetaTags';
import Content from './Content';
import Header from './Header';
import Layout from './Layout';
import Main from './Main';

interface Props {
    onLogin: (data: OnLoginCallbackArguments) => Promise<void>;
    toApp?: APP_NAMES;
    toAppName?: string;
    activeSessions?: LocalSessionPersisted[];
    onSignOut: (updatedActiveSessions?: LocalSessionPersisted[]) => void;
    onAddAccount: () => void;
    metaTags: MetaTags;
}

const compareSessions = (a: LocalSessionPersisted, b: LocalSessionPersisted) => {
    if (a.remote.DisplayName && b.remote.DisplayName) {
        return a.remote.DisplayName.localeCompare(b.remote.DisplayName);
    }
    if (a.remote.Username && b.remote.Username) {
        return a.remote.Username.localeCompare(b.remote.Username);
    }
    if (a.remote.PrimaryEmail && b.remote.PrimaryEmail) {
        return a.remote.PrimaryEmail.localeCompare(b.remote.PrimaryEmail);
    }
    return 0;
};

const SwitchAccountContainer = ({ metaTags, toAppName, onLogin, activeSessions, onAddAccount, onSignOut }: Props) => {
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const errorHandler = useErrorHandler();

    useMetaTags(metaTags);

    const [localActiveSessions, setLocalActiveSessions] = useState(activeSessions);
    const [loading, withLoading] = useLoading(!localActiveSessions);
    const [loadingMap, setLoadingMap] = useState<{ [key: number]: boolean }>({});
    const [error, setError] = useState(false);
    const { createNotification } = useNotifications();
    const { createModal } = useModals();

    useEffect(() => {
        startUnAuthFlow().catch(noop);
    }, []);

    useEffect(() => {
        if (!activeSessions) {
            const run = async () => {
                const { sessions } = await getActiveSessions(silentApi);
                setLocalActiveSessions(sessions);
            };
            void withLoading(run().catch(() => setError(true)));
        }
    }, []);

    const clearSession = (session: PersistedSessionWithLocalID, clearDeviceRecovery: boolean) => {
        removePersistedSession(session.localID, session.UID);
        if (clearDeviceRecovery) {
            removeDeviceRecovery(session.UserID);
        }
        silentApi(withUIDHeaders(session.UID, revoke())).catch(noop);
    };

    const handleSignOut = (sessions: LocalSessionPersisted[], clearDeviceRecovery: boolean) => {
        sessions.forEach((session) => {
            clearSession(session.persisted, clearDeviceRecovery);
        });
        const remove = new Set(sessions.map((session) => session.remote.LocalID));
        const updatedActiveSessions = localActiveSessions?.filter((session) => !remove.has(session.remote.LocalID));
        setLocalActiveSessions(updatedActiveSessions);
        onSignOut(updatedActiveSessions);
    };

    const handleSignOutMultiple = (sessions: LocalSessionPersisted[]) => {
        if (sessions.some((session) => getHasRecoveryMessage(session.remote.UserID))) {
            return createModal(
                <ConfirmSignOutModal
                    onSignOut={(clearDeviceRecovery: boolean) => {
                        handleSignOut(sessions, clearDeviceRecovery);
                    }}
                />
            );
        }
        handleSignOut(sessions, false);
    };

    const handleClickSession = async (localID: number) => {
        try {
            setLoadingMap((old) => ({ ...old, [localID]: true }));
            await wait(1000);
            const validatedSession = await resumeSession(silentApi, localID);
            await onLogin({ ...validatedSession, flow: 'switch' });
        } catch (e: any) {
            setLoadingMap((old) => ({ ...old, [localID]: false }));
            if (e instanceof InvalidPersistentSessionError) {
                setLocalActiveSessions((list) => {
                    return list?.filter((session) => session.remote.LocalID !== localID);
                });
                createNotification({
                    type: 'error',
                    text: c('Error').t`The session has expired. Please sign in again.`,
                });
                return;
            }
            errorHandler(e);
        }
    };

    const inner = () => {
        if (error) {
            const refresh = (
                <InlineLinkButton key="1" onClick={() => window.location.reload()}>
                    {
                        // translator: Full sentence is "Failed to get active sessions. Please refresh the page or try again later."
                        c('Action').t`refresh the page`
                    }
                </InlineLinkButton>
            );

            return (
                <Alert className="mb-3" type="error">
                    {
                        // translator: Full sentence is "Failed to get active sessions. Please refresh the page or try again later."
                        c('Error').jt`Failed to get active sessions. Please ${refresh} or try again later.`
                    }
                </Alert>
            );
        }

        if (loading) {
            return <Loader />;
        }

        if (!localActiveSessions?.length) {
            return <Alert className="mb-4">{c('Error').t`No active sessions`}</Alert>;
        }

        return [...localActiveSessions.sort(compareSessions)].map((session, index) => {
            const { LocalID, DisplayName, Username, PrimaryEmail } = session.remote;
            const isLoading = loadingMap[LocalID];

            const isAdminSignedIntoMember = session.persisted.isSubUser;
            const nameToDisplay = DisplayName || Username || PrimaryEmail || '';
            const initials = getInitials(nameToDisplay);

            const maybeEmailInBrackets = PrimaryEmail ? `<${PrimaryEmail}>` : '';

            // translator: This is the tooltip that appears when you hover over an account button in switch account screen. Ex.: Continue with Kung Fury <kung.fury@pm.me>
            const continueWithText = c('Action').t`Continue with ${nameToDisplay} ${maybeEmailInBrackets}`;
            // translator: This is the tooltip that appears when you hover over an 'sign out' button in switch account screen. Ex.: Sign out from Kung Fury <kung.fury@pm.me>
            const signOutText = c('Action').t`Sign out from ${nameToDisplay} ${maybeEmailInBrackets}`;

            return (
                <Fragment key={LocalID}>
                    <div
                        className={clsx(
                            'account-button p-3 interactive-pseudo-inset flex flex-align-items-start w100 text-left rounded relative',
                            isLoading && 'is-loading'
                        )}
                    >
                        <span className="flex user-initials rounded bg-primary">
                            <span className="m-auto text-semibold" aria-hidden="true">
                                {initials}
                            </span>
                        </span>
                        <div
                            className="account-button-content mx-3 flex-item-fluid mt-custom"
                            style={{ '--mt-custom': `-0.25em` }}
                        >
                            <button
                                type="button"
                                className="text-left increase-click-surface outline-none--at-all"
                                title={continueWithText}
                                aria-label={continueWithText}
                                onClick={() => {
                                    void handleClickSession(LocalID);
                                }}
                            >
                                <div className="text-break">
                                    <strong>{nameToDisplay}</strong>
                                    {isAdminSignedIntoMember && (
                                        <span className="color-weak">
                                            {' - '}
                                            {c('Info').t`Member`}
                                        </span>
                                    )}
                                </div>
                                {PrimaryEmail && <div className="text-break color-weak">{PrimaryEmail}</div>}
                            </button>
                            <div>
                                <InlineLinkButton
                                    className="relative upper-layer"
                                    title={signOutText}
                                    aria-label={signOutText}
                                    onClick={() => {
                                        handleSignOutMultiple([session]);
                                    }}
                                >
                                    {c('Action').t`Sign out`}
                                </InlineLinkButton>
                            </div>
                        </div>
                        {isLoading ? (
                            <div className="account-button-icon flex text-lg my-auto">
                                <CircleLoader />
                            </div>
                        ) : (
                            <Icon className="account-button-icon my-auto" name="arrow-right" aria-hidden="true" />
                        )}
                    </div>
                    {index !== localActiveSessions.length - 1 && <hr className="my-2" />}
                </Fragment>
            );
        });
    };

    const children = (
        <Main>
            <Header
                title={c('Title').t`Choose an account`}
                subTitle={toAppName ? c('Info').t`to continue to ${toAppName}` : undefined}
            />
            <Content className="flex">
                <div className="w100 max-h-custom" style={{ '--max-h-custom': '25em' }}>
                    <Scroll>{inner()}</Scroll>
                </div>
                <div className="w100 text-center mt-7 mb-2">
                    <Button size="large" color="weak" shape="outline" fullWidth onClick={onAddAccount}>{c('Action')
                        .t`Add ${BRAND_NAME} Account`}</Button>
                </div>
                <div className="w100 text-center mb-2">
                    <Button
                        size="large"
                        color="norm"
                        shape="ghost"
                        fullWidth
                        onClick={() => {
                            handleSignOutMultiple(localActiveSessions || []);
                        }}
                    >{c('Action').t`Sign out of all accounts`}</Button>
                </div>
            </Content>
        </Main>
    );
    return <Layout>{children}</Layout>;
};

export default SwitchAccountContainer;
