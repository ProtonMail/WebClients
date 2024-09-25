import { Fragment, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button, CircleLoader, InlineLinkButton, Scroll } from '@proton/atoms';
import type { OnLoginCallback } from '@proton/components';
import {
    Alert,
    ConfirmSignOutModal,
    Icon,
    Loader,
    Prompt,
    startUnAuthFlow,
    useApi,
    useErrorHandler,
    useModalState,
    useNotifications,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import { revoke } from '@proton/shared/lib/api/auth';
import type { PersistedSessionWithLocalID } from '@proton/shared/lib/authentication/SessionInterface';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import { ForkSearchParameters, getEmailSessionForkSearchParameter } from '@proton/shared/lib/authentication/fork';
import type { LocalSessionPersisted } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getActiveSessions, resumeSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { removePersistedSession } from '@proton/shared/lib/authentication/persistedSessionStorage';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { getHasRecoveryMessage, removeDeviceRecovery } from '@proton/shared/lib/recoveryFile/deviceRecovery';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import type { MetaTags } from '../useMetaTags';
import { useMetaTags } from '../useMetaTags';
import Content from './Content';
import Header from './Header';
import Layout from './Layout';
import Main from './Main';
import { getContinueToString } from './helper';

interface Props {
    onLogin: OnLoginCallback;
    toApp?: APP_NAMES;
    toAppName?: string;
    activeSessions?: LocalSessionPersisted[];
    updateActiveSessions: (updatedActiveSessions?: LocalSessionPersisted[]) => void;
    onAddAccount: () => void;
    onEmptySessions: () => void;
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

const SwitchAccountContainer = ({
    metaTags,
    toApp,
    toAppName,
    onLogin,
    activeSessions,
    onAddAccount,
    updateActiveSessions,
    onEmptySessions,
}: Props) => {
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const errorHandler = useErrorHandler();

    useMetaTags(metaTags);

    const [loading, withLoading] = useLoading(!activeSessions);
    const [loadingMap, setLoadingMap] = useState<{ [key: number]: boolean }>({});
    const [error, setError] = useState(false);
    const { createNotification } = useNotifications();
    const validRef = useRef(false);

    const [openSignOutAllPrompt, setOpenSignOutAllPrompt, renderOpenSignOutAllPrompt] = useModalState();
    const [confirmSignoutModal, setConfirmSignoutModal, renderConfirmSignoutModal] = useModalState();
    const [tmpSessions, setTmpSessions] = useState<LocalSessionPersisted[]>([]);

    useEffect(() => {
        startUnAuthFlow().catch(noop);
    }, []);

    useEffect(() => {
        if (!activeSessions) {
            const run = async () => {
                const searchParams = new URLSearchParams(window.location.search);
                const { sessions } = await getActiveSessions({
                    api: silentApi,
                    email: getEmailSessionForkSearchParameter(searchParams),
                });
                updateActiveSessions(sessions);
            };
            void withLoading(run().catch(() => setError(true)));
        } else if (!activeSessions.length) {
            onEmptySessions();
        }
    }, []);

    const clearSession = (session: PersistedSessionWithLocalID, clearDeviceRecovery: boolean) => {
        removePersistedSession(session.localID, session.UID).catch(noop);
        if (clearDeviceRecovery) {
            removeDeviceRecovery(session.UserID);
        }
        silentApi(withUIDHeaders(session.UID, revoke())).catch(noop);
    };

    const removeSessions = (localIDs: number[]) => {
        const removeSet = new Set(localIDs);
        const updatedActiveSessions = (activeSessions || [])?.filter(
            (session) => !removeSet.has(session.remote.LocalID)
        );
        updateActiveSessions(updatedActiveSessions);
    };

    const handleSignOut = (sessions: LocalSessionPersisted[], clearDeviceRecovery: boolean) => {
        sessions.forEach((session) => {
            clearSession(session.persisted, clearDeviceRecovery);
        });
        removeSessions(sessions.map((session) => session.remote.LocalID));
    };

    const handleSignOutMultiple = (sessions: LocalSessionPersisted[], type: 'all' | 'single') => {
        setTmpSessions(sessions);
        if (sessions.some((session) => getHasRecoveryMessage(session.remote.UserID))) {
            setConfirmSignoutModal(true);
            return;
        }
        if (type === 'all') {
            setOpenSignOutAllPrompt(true);
            return;
        }
        return handleSignOut(sessions, false);
    };

    const handleClickSession = async (localID: number) => {
        try {
            if (validRef.current) {
                return;
            }
            validRef.current = true;
            const params = new URLSearchParams(location.search);
            setLoadingMap((old) => ({ ...old, [localID]: true }));
            const validatedSession = await resumeSession({ api: silentApi, localID });
            await onLogin({
                ...validatedSession,
                flow: 'switch',
                prompt: params.get(ForkSearchParameters.Prompt) === 'login' ? 'login' : undefined,
            });
        } catch (e: any) {
            setLoadingMap((old) => ({ ...old, [localID]: false }));
            if (e instanceof InvalidPersistentSessionError) {
                removeSessions([localID]);
                createNotification({
                    type: 'error',
                    text: c('Error').t`The session has expired. Please sign in again.`,
                });
                return;
            }
            errorHandler(e);
        } finally {
            validRef.current = false;
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

        if (!activeSessions?.length) {
            return <div className="mb-4">{c('Error').t`No active sessions`}</div>;
        }

        return [...activeSessions.sort(compareSessions)].map((session, index) => {
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
                            'account-button p-3 interactive-pseudo-inset flex items-start w-full text-left rounded relative',
                            isLoading && 'is-loading'
                        )}
                    >
                        <span className="flex user-initials rounded bg-primary">
                            <span className="m-auto text-semibold" aria-hidden="true">
                                {initials}
                            </span>
                        </span>
                        <div
                            className="account-button-content mx-3 flex-1 mt-custom"
                            style={{ '--mt-custom': `-0.25em` }}
                        >
                            <button
                                type="button"
                                className="text-left expand-click-area outline-none--at-all"
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
                                    className="relative z-up"
                                    title={signOutText}
                                    aria-label={signOutText}
                                    onClick={() => {
                                        handleSignOutMultiple([session], 'single');
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
                    {index !== activeSessions.length - 1 && <hr className="my-2" />}
                </Fragment>
            );
        });
    };

    const children = (
        <Main>
            <Header
                title={c('Title').t`Choose an account`}
                subTitle={toAppName ? getContinueToString(toAppName) : undefined}
            />
            <Content className="flex">
                <div className="w-full max-h-custom" style={{ '--max-h-custom': '25em' }}>
                    <Scroll>{inner()}</Scroll>
                </div>
                <div className="w-full text-center mt-7 mb-2">
                    <Button size="large" color="weak" shape="outline" fullWidth onClick={onAddAccount}>{c('Action')
                        .t`Add ${BRAND_NAME} Account`}</Button>
                </div>
                <div className="w-full text-center mb-2">
                    <Button
                        size="large"
                        color="norm"
                        shape="ghost"
                        fullWidth
                        onClick={() => {
                            handleSignOutMultiple(activeSessions || [], 'all');
                        }}
                    >{c('Action').t`Sign out of all accounts`}</Button>
                </div>
                {renderConfirmSignoutModal && (
                    <ConfirmSignOutModal
                        onSignOut={(clearData) => {
                            handleSignOut(tmpSessions, clearData);
                        }}
                        {...confirmSignoutModal}
                    />
                )}
                {renderOpenSignOutAllPrompt && (
                    <Prompt
                        title={c('Title').t`Are you sure?`}
                        buttons={[
                            <Button
                                color="norm"
                                onClick={() => {
                                    handleSignOut(tmpSessions, false);
                                    openSignOutAllPrompt.onClose();
                                }}
                            >{c('Action').t`Continue`}</Button>,
                            <Button onClick={() => openSignOutAllPrompt.onClose()}>{c('Action').t`Cancel`}</Button>,
                        ]}
                        {...openSignOutAllPrompt}
                    >
                        <p>{c('Info').t`This will sign you out of all accounts currently logged in.`}</p>
                    </Prompt>
                )}
            </Content>
        </Main>
    );
    return <Layout toApp={toApp}>{children}</Layout>;
};

export default SwitchAccountContainer;
