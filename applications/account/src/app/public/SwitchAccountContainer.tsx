import { type Dispatch, Fragment, type SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button, CircleLoader, InlineLinkButton, Scroll } from '@proton/atoms';
import type { OnLoginCallback } from '@proton/components';
import { SkeletonLoader } from '@proton/components';
import { ConfirmSignOutModal, Icon, useErrorHandler, useModalState, useNotifications } from '@proton/components';
import ConfirmSignOutAllModal from '@proton/components/components/confirmSignOutModal/ConfirmSignoutAllModal';
import { useLoading } from '@proton/hooks';
import { revoke } from '@proton/shared/lib/api/auth';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import { ForkSearchParameters } from '@proton/shared/lib/authentication/fork';
import {
    type ActiveSession,
    type GetActiveSessionsResult,
    compareSessions,
    resumeSession,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { removePersistedSession } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { getSessionDisplayData } from '@proton/shared/lib/authentication/sessionDisplay';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import type { Api } from '@proton/shared/lib/interfaces';
import { getHasRecoveryMessage, removeDeviceRecovery } from '@proton/shared/lib/recoveryFile/storage';
import clamp from '@proton/utils/clamp';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import type { MetaTags } from '../useMetaTags';
import { useMetaTags } from '../useMetaTags';
import Content from './Content';
import Header from './Header';
import Layout from './Layout';
import Main from './Main';
import { getContinueToString } from './helper';

const clearSession = ({
    api,
    clearDeviceRecovery,
    activeSession,
}: {
    api: Api;
    activeSession: ActiveSession;
    clearDeviceRecovery: boolean;
}) => {
    const session = activeSession.persisted;
    removePersistedSession(session).catch(noop);
    if (clearDeviceRecovery) {
        removeDeviceRecovery(session.UserID);
    }
    api(withUIDHeaders(session.UID, revoke())).catch(noop);
};

const AccountItem = ({
    isLoading,
    sessionDisplayData,
    onClick,
    onSignout,
}: {
    onClick: (localID: number) => void;
    onSignout: () => void;
    isLoading: boolean;
    sessionDisplayData: ReturnType<typeof getSessionDisplayData>;
}) => {
    const nameToDisplay = sessionDisplayData.name;
    const maybeEmailInBrackets = sessionDisplayData.maybeEmailInBrackets;

    // translator: This is the tooltip that appears when you hover over an account button in switch account screen. Ex.: Continue with Kung Fury <kung.fury@pm.me>
    const continueWithText = c('Action').t`Continue with ${nameToDisplay} ${maybeEmailInBrackets}`;
    // translator: This is the tooltip that appears when you hover over an 'sign out' button in switch account screen. Ex.: Sign out from Kung Fury <kung.fury@pm.me>
    const signOutText = c('Action').t`Sign out from ${nameToDisplay} ${maybeEmailInBrackets}`;

    return (
        <div
            className={clsx(
                'account-button p-3 interactive-pseudo-inset flex items-start w-full text-left rounded relative',
                isLoading && 'is-loading'
            )}
        >
            <span className="flex user-initials rounded bg-primary">
                <span className="m-auto text-semibold" aria-hidden="true">
                    {sessionDisplayData.initials}
                </span>
            </span>
            <div className="account-button-content mx-3 flex-1 mt-custom" style={{ '--mt-custom': `-0.25em` }}>
                <button
                    type="button"
                    className="text-left expand-click-area outline-none--at-all"
                    title={continueWithText}
                    aria-label={continueWithText}
                    onClick={() => {
                        onClick(sessionDisplayData.localID);
                    }}
                >
                    <div className="text-break">
                        <strong>{nameToDisplay}</strong>
                        {sessionDisplayData.status.isAdminSignedIntoMember && (
                            <span className="color-weak">
                                {' - '}
                                {c('Info').t`Member`}
                            </span>
                        )}
                    </div>
                    {sessionDisplayData.email && (
                        <div className="text-break color-weak">{sessionDisplayData.email}</div>
                    )}
                </button>
                <div>
                    <InlineLinkButton
                        className="relative z-up"
                        title={signOutText}
                        aria-label={signOutText}
                        onClick={() => {
                            onSignout();
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
    );
};

interface Props {
    api: Api;
    onLogin: OnLoginCallback;
    toApp?: APP_NAMES;
    toAppName?: string;
    activeSessions?: ActiveSession[];
    onActiveSessions: Dispatch<SetStateAction<ActiveSession[] | undefined>>;
    onGetActiveSessions: () => Promise<GetActiveSessionsResult>;
    initialSessionsLength: number;
    onAddAccount: () => void;
    onEmptySessions: () => void;
    metaTags: MetaTags;
}

const SwitchAccountContainer = ({
    api,
    metaTags,
    toApp,
    toAppName,
    initialSessionsLength,
    onLogin,
    onGetActiveSessions,
    activeSessions,
    onAddAccount,
    onActiveSessions,
    onEmptySessions,
}: Props) => {
    const silentApi = getSilentApi(api);
    const errorHandler = useErrorHandler();

    useMetaTags(metaTags);

    const [loading, withLoading] = useLoading(!activeSessions);
    const [loadingMap, setLoadingMap] = useState<{ [key: number]: boolean }>({});
    const [error, setError] = useState(false);
    const { createNotification } = useNotifications();
    const validRef = useRef(false);

    const [openSignOutAllPrompt, setOpenSignOutAllPrompt, renderOpenSignOutAllPrompt] = useModalState();
    const [confirmSignoutModal, setConfirmSignoutModal, renderConfirmSignoutModal] = useModalState();
    const [tmpSessions, setTmpSessions] = useState<ActiveSession[]>([]);

    useEffect(() => {
        if (!activeSessions) {
            void withLoading(onGetActiveSessions().catch(() => setError(true)));
        }
    }, []);

    useEffect(() => {
        if (Array.isArray(activeSessions) && !activeSessions.length) {
            onEmptySessions();
        }
    }, [activeSessions]);

    const removeSessions = useCallback((localIDs: number[]) => {
        const removeSet = new Set(localIDs);
        onActiveSessions((oldActiveSessions) => {
            const updatedActiveSessions = (oldActiveSessions || [])?.filter(
                (session) => !removeSet.has(session.remote.LocalID)
            );
            return updatedActiveSessions;
        });
    }, []);

    const handleSignOut = useCallback((activeSessions: ActiveSession[], clearDeviceRecovery: boolean) => {
        activeSessions.forEach((activeSession) => {
            clearSession({ api: silentApi, activeSession, clearDeviceRecovery });
        });
        removeSessions(activeSessions.map((session) => session.remote.LocalID));
    }, []);

    const handleSignOutMultiple = useCallback((activeSessions: ActiveSession[], type: 'all' | 'single') => {
        setTmpSessions(activeSessions);
        if (activeSessions.some((session) => getHasRecoveryMessage(session.remote.UserID))) {
            setConfirmSignoutModal(true);
            return;
        }
        if (type === 'all') {
            setOpenSignOutAllPrompt(true);
            return;
        }
        return handleSignOut(activeSessions, false);
    }, []);

    const handleClickSession = async (localID: number) => {
        try {
            if (validRef.current) {
                return;
            }
            validRef.current = true;
            const params = new URLSearchParams(location.search);
            setLoadingMap((old) => ({ ...old, [localID]: true }));
            const resumedSessionResult = await resumeSession({ api: silentApi, localID });
            await onLogin({
                data: resumedSessionResult,
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
                <div>
                    {
                        // translator: Full sentence is "Failed to get active sessions. Please refresh the page or try again later."
                        c('Error').jt`Failed to get active sessions. Please ${refresh} or try again later.`
                    }
                </div>
            );
        }

        if (loading) {
            return (
                <div className="flex flex-column gap-2">
                    {new Array(clamp(initialSessionsLength, 1, 4)).fill(0).map((_, idx) => {
                        return <SkeletonLoader key={idx} width="100%" height="6em" index={0} />;
                    })}
                </div>
            );
        }

        if (!activeSessions?.length) {
            return <div className="mb-4">{c('Error').t`No active sessions`}</div>;
        }

        return [...activeSessions].sort(compareSessions).map((session, index) => {
            const sessionDisplayData = getSessionDisplayData(session);
            const localID = sessionDisplayData.localID;
            const isLoading = loadingMap[sessionDisplayData.localID];

            return (
                <Fragment key={localID}>
                    <AccountItem
                        onClick={handleClickSession}
                        onSignout={() => {
                            handleSignOutMultiple([session], 'single');
                        }}
                        isLoading={isLoading}
                        sessionDisplayData={sessionDisplayData}
                    />
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
                    <ConfirmSignOutAllModal
                        onSignOut={() => {
                            handleSignOut(tmpSessions, false);
                        }}
                        {...openSignOutAllPrompt}
                    />
                )}
            </Content>
        </Main>
    );
    return <Layout toApp={toApp}>{children}</Layout>;
};

export default SwitchAccountContainer;
