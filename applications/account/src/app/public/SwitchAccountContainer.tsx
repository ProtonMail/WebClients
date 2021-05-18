import React, { useEffect, useState } from 'react';
import { c } from 'ttag';
import { APP_NAMES, BRAND_NAME } from 'proton-shared/lib/constants';

import { resumeSession, getActiveSessions } from 'proton-shared/lib/authentication/persistedSessionHelper';
import { getPersistedSession, removePersistedSession } from 'proton-shared/lib/authentication/persistedSessionStorage';
import { InvalidPersistentSessionError } from 'proton-shared/lib/authentication/error';
import { LocalSessionResponse } from 'proton-shared/lib/authentication/interface';
import { getInitials } from 'proton-shared/lib/helpers/string';
import { wait } from 'proton-shared/lib/helpers/promise';
import { withUIDHeaders } from 'proton-shared/lib/fetch/headers';
import { revoke } from 'proton-shared/lib/api/auth';
import { noop } from 'proton-shared/lib/helpers/function';

import {
    LinkButton,
    Loader,
    LoaderIcon,
    OnLoginCallbackArguments,
    useApi,
    useErrorHandler,
    useLoading,
    useNotifications,
} from 'react-components';
import { getToAppName } from './helper';
import Main from './Main';
import Header from './Header';
import Footer from './Footer';
import Content from './Content';

interface Props {
    onLogin: (data: OnLoginCallbackArguments) => Promise<void>;
    toApp?: APP_NAMES;
    activeSessions?: LocalSessionResponse[];
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

const sortSessions = (sessions: LocalSessionResponse[]) => {
    return [...sessions].sort(compareSessions);
};

const SwitchAccountContainer = ({ toApp, onLogin, activeSessions, onAddAccount, onSignOutAll }: Props) => {
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
            withLoading(run().catch(() => setError(true)));
        }
    }, []);

    const handleSignOutAll = async () => {
        localActiveSessions?.map(({ LocalID }) => {
            const persistedSession = getPersistedSession(LocalID);
            removePersistedSession(LocalID);
            if (persistedSession && persistedSession.UID) {
                return silentApi(withUIDHeaders(persistedSession.UID, revoke())).catch(noop);
            }
            return undefined;
        });
        onSignOutAll();
    };

    const handleClickSession = async (localID: number) => {
        try {
            setLoadingMap((old) => ({ ...old, [localID]: true }));
            await wait(1000);
            const validatedSession = await resumeSession(silentApi, localID);
            await onLogin({ ...validatedSession, flow: 'switch' });
        } catch (e) {
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
        } finally {
            setLoadingMap((old) => ({ ...old, [localID]: false }));
        }
    };

    const listItemClassName = 'flex-no-min-children w100 mt0-25 pt0-25 text-left';

    const inner = () => {
        if (error) {
            return (
                <div className={listItemClassName}>{c('Error')
                    .t`Failed to get active sessions. Please refresh or try again later.`}</div>
            );
        }
        if (loading) {
            return <Loader />;
        }
        if (!localActiveSessions?.length) {
            return <div className={listItemClassName}>{c('Error').t`No active sessions`}</div>;
        }
        return sortSessions(localActiveSessions).map(({ DisplayName, Username, LocalID, PrimaryEmail }) => {
            const nameToDisplay = DisplayName || Username || PrimaryEmail || '';
            const initials = getInitials(nameToDisplay);
            return (
                <button
                    type="button"
                    key={LocalID}
                    className={`${listItemClassName} button-show-on-hover flex-align-items-center button-account no-outline`}
                    onClick={() => handleClickSession(LocalID)}
                >
                    <span className="user-initials rounded p0-25 mb0-5 inline-flex bg-primary">
                        <span className="dropdown-logout-text mauto text-semibold" aria-hidden="true">
                            {initials}
                        </span>
                    </span>
                    <div className="no-scroll ml1 border-bottom pr1 pb1 mt0-25 flex-item-fluid flex flex-align-items-center">
                        <div className="flex-item-fluid">
                            <strong className="block text-ellipsis" title={nameToDisplay}>
                                {nameToDisplay}
                            </strong>
                            <div className="text-ellipsis color-weak" title={PrimaryEmail}>
                                {PrimaryEmail}
                            </div>
                        </div>
                        <div className="ml1 block no-tiny-mobile no-scroll button-show-on-hover-element button-account-login text-sm m0 flex flex-align-items-center color-primary">
                            {loadingMap[LocalID] ? <LoaderIcon /> : c('Action').t`Sign in`}
                        </div>
                    </div>
                </button>
            );
        });
    };

    const toAppName = getToAppName(toApp);

    return (
        <Main>
            <Header
                title={c('Title').t`Choose an account`}
                subTitle={toAppName ? c('Info').t`to continue to ${toAppName}` : undefined}
            />
            <Content>
                <div className="scroll-if-needed" style={{ maxHeight: '20em' }}>
                    {inner()}
                </div>
                <LinkButton className="mt1" onClick={onAddAccount}>{c('Action')
                    .t`Add ${BRAND_NAME} account`}</LinkButton>
            </Content>
            <Footer>
                <LinkButton className="mlauto mrauto" onClick={handleSignOutAll}>{c('Action')
                    .t`Sign out all accounts`}</LinkButton>
            </Footer>
        </Main>
    );
};

export default SwitchAccountContainer;
