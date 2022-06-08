import { Fragment, MouseEvent, useEffect, useState } from 'react';
import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';
import { resumeSession, getActiveSessions } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getPersistedSession, removePersistedSession } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import { LocalSessionResponse } from '@proton/shared/lib/authentication/interface';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { wait } from '@proton/shared/lib/helpers/promise';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { revoke } from '@proton/shared/lib/api/auth';
import noop from '@proton/utils/noop';

import {
    Loader,
    CircleLoader,
    OnLoginCallbackArguments,
    useApi,
    useErrorHandler,
    useLoading,
    useNotifications,
    Button,
    Alert,
    InlineLinkButton,
    Icon,
    Scroll,
    classnames,
} from '@proton/components';
import Main from './Main';
import Header from './Header';
import Content from './Content';

import './SwitchAccountContainer.scss';
import Layout from './Layout';

interface Props {
    onLogin: (data: OnLoginCallbackArguments) => Promise<void>;
    toAppName?: string;
    activeSessions?: LocalSessionResponse[];
    onSignOut: (updatedActiveSessions?: LocalSessionResponse[]) => void;
    onSignOutAll: () => void;
    onAddAccount: () => void;
}

const compareSessions = (a: LocalSessionResponse, b: LocalSessionResponse) => {
    if (a.DisplayName && b.DisplayName) {
        return a.DisplayName.localeCompare(b.DisplayName);
    }
    if (a.Username && b.Username) {
        return a.Username.localeCompare(b.Username);
    }
    if (a.PrimaryEmail && b.PrimaryEmail) {
        return a.PrimaryEmail.localeCompare(b.PrimaryEmail);
    }
    return 0;
};

const SwitchAccountContainer = ({
    toAppName,
    onLogin,
    activeSessions,
    onAddAccount,
    onSignOut,
    onSignOutAll,
}: Props) => {
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const errorHandler = useErrorHandler();

    const [localActiveSessions, setLocalActiveSessions] = useState(activeSessions);
    const [loading, withLoading] = useLoading(!localActiveSessions);
    const [loadingMap, setLoadingMap] = useState<{ [key: number]: boolean }>({});
    const [error, setError] = useState(false);
    const { createNotification } = useNotifications();

    useEffect(() => {
        if (!activeSessions) {
            const run = async () => {
                const { sessions } = await getActiveSessions(silentApi);
                setLocalActiveSessions(sessions);
            };
            void withLoading(run().catch(() => setError(true)));
        }
    }, []);

    const clearSession = (localID: number) => {
        const persistedSession = getPersistedSession(localID);
        if (!persistedSession) {
            return;
        }
        removePersistedSession(localID, persistedSession.UID);
        silentApi(withUIDHeaders(persistedSession.UID, revoke())).catch(noop);
    };

    const handleSignOut = async (event: MouseEvent<HTMLButtonElement>, localID: number) => {
        clearSession(localID);
        const updatedActiveSessions = localActiveSessions?.filter((session) => session.LocalID !== localID);
        setLocalActiveSessions(updatedActiveSessions);
        onSignOut(updatedActiveSessions);
    };

    const handleSignOutAll = async () => {
        localActiveSessions?.forEach(({ LocalID }) => {
            clearSession(LocalID);
        });
        onSignOutAll();
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
                    return list?.filter(({ LocalID: otherLocalID }) => otherLocalID !== localID);
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
                <Alert className="mb1" type="error">
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
            return <Alert className="mb1">{c('Error').t`No active sessions`}</Alert>;
        }

        return [...localActiveSessions.sort(compareSessions)].map(
            ({ DisplayName, Username, LocalID, PrimaryEmail }, index) => {
                const isLoading = loadingMap[LocalID];

                const nameToDisplay = DisplayName || Username || PrimaryEmail || '';
                const initials = getInitials(nameToDisplay);

                const maybeEmailInBrackets = PrimaryEmail ? `<${PrimaryEmail}>` : '';

                // translator: This is the tooltip that appears when you hover over an account button in switch account screen. Ex.: Continue with Kung Fury <kung.fury@pm.me>
                const continueWithText = `${c('Action').t`Continue with`} ${nameToDisplay} ${maybeEmailInBrackets}`;
                // translator: This is the tooltip that appears when you hover over an 'sign out' button in switch account screen. Ex.: Sign out from Kung Fury <kung.fury@pm.me>
                const signOutText = `${c('Action').t`Sign out from`} ${nameToDisplay} ${maybeEmailInBrackets}`;

                return (
                    <Fragment key={LocalID}>
                        <div
                            className={classnames([
                                'account-button p1 interactive flex flex-align-items-start w100 text-left rounded relative',
                                isLoading && 'is-loading',
                            ])}
                        >
                            <span className="flex user-initials rounded bg-primary">
                                <span className="mauto text-semibold" aria-hidden="true">
                                    {initials}
                                </span>
                            </span>
                            <div className="account-button-content mx1 flex-item-fluid">
                                <button
                                    type="button"
                                    className="text-left increase-click-surface"
                                    title={continueWithText}
                                    aria-label={continueWithText}
                                    onClick={() => handleClickSession(LocalID)}
                                >
                                    <strong className="block text-break">{nameToDisplay}</strong>
                                    {PrimaryEmail && <div className="text-break color-weak">{PrimaryEmail}</div>}
                                </button>
                                <div>
                                    <InlineLinkButton
                                        className="relative upper-layer"
                                        title={signOutText}
                                        aria-label={signOutText}
                                        onClick={(event) => handleSignOut(event, LocalID)}
                                    >
                                        {c('Action').t`Sign out`}
                                    </InlineLinkButton>
                                </div>
                            </div>
                            {isLoading ? (
                                <div className="account-button-icon flex text-lg mtauto mbauto">
                                    <CircleLoader />
                                </div>
                            ) : (
                                <Icon
                                    className="account-button-icon  mtauto mbauto"
                                    name="arrow-right"
                                    aria-hidden="true"
                                />
                            )}
                        </div>
                        {index !== localActiveSessions.length - 1 && <hr className="my0-5" />}
                    </Fragment>
                );
            }
        );
    };

    const children = (
        <Main>
            <Header
                title={c('Title').t`Choose an account`}
                subTitle={toAppName ? c('Info').t`to continue to ${toAppName}` : undefined}
            />
            <Content className="flex">
                <div className="w100 max-h-custom" style={{ '--max-height-custom': '25em' }}>
                    <Scroll>{inner()}</Scroll>
                </div>
                <div className="w100 text-center mt2 mb0-5">
                    <Button size="large" color="weak" shape="outline" fullWidth onClick={onAddAccount}>{c('Action')
                        .t`Add ${BRAND_NAME} Account`}</Button>
                </div>
                <div className="w100 text-center mb0-5">
                    <Button size="large" color="norm" shape="ghost" fullWidth onClick={handleSignOutAll}>{c('Action')
                        .t`Sign out of all accounts`}</Button>
                </div>
            </Content>
        </Main>
    );
    return <Layout>{children}</Layout>;
};

export default SwitchAccountContainer;
