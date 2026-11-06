import { Fragment, useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { Scroll } from '@proton/atoms/Scroll/Scroll';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import { IcArrowRight } from '@proton/icons/icons/IcArrowRight';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { AccessType } from '@proton/shared/lib/authentication/accessType';
import { type ActiveSession, compareSessions } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getSessionDisplayData } from '@proton/shared/lib/authentication/sessionDisplay';
import { APPS, BRAND_NAME, SSO_PATHS } from '@proton/shared/lib/constants';
import { getShouldProcessLinkClick } from '@proton/shared/lib/helpers/dom';
import { getHasRecoveryMessage } from '@proton/shared/lib/recoveryFile/storage';
import clamp from '@proton/utils/clamp';
import clsx from '@proton/utils/clsx';

import { PublicAppContext } from '../content/state-machine/PublicAppContext';
import {
    selectPaths,
    selectPreAppIntent,
    selectSigningInLocalID,
    selectToAppName,
} from '../content/state-machine/publicAppStateMachine';
import { getLoginMeta } from '../sign-in/loginPagesJson';
import { useMetaTags } from '../useMetaTags';
import type { ConfirmSignoutModalProps } from './ConfirmSignOutModal';
import { ConfirmSignOutModal } from './ConfirmSignOutModal';
import Content from './Content';
import Header from './Header';
import Layout from './Layout';
import Main from './Main';
import { getContinueToString } from './helper';

const AccountItem = ({
    isLoading,
    sessionDisplayData,
    onClick,
    onSignout,
    href,
}: {
    onClick: (localID: number) => void;
    onSignout: () => void;
    isLoading: boolean;
    sessionDisplayData: ReturnType<typeof getSessionDisplayData>;
    href: string;
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
                <a
                    href={href}
                    className="text-left expand-click-area outline-none--at-all w-full text-no-decoration"
                    title={continueWithText}
                    aria-label={continueWithText}
                    onClick={(event) => {
                        const target = event.currentTarget?.getAttribute('target') || '';
                        if (getShouldProcessLinkClick(event.nativeEvent, target)) {
                            event.preventDefault();
                            onClick(sessionDisplayData.localID);
                            return;
                        }
                        // Otherwise let link (e.g. new tab) clicks fall through
                    }}
                >
                    <div className="text-break text-ellipsis">
                        <strong className="color-norm">{nameToDisplay}</strong>
                        {sessionDisplayData.accessType === AccessType.AdminAccess && (
                            <span className="color-weak">
                                {' - '}
                                {c('Info').t`Member`}
                            </span>
                        )}
                        {sessionDisplayData.accessType === AccessType.EmergencyAccess && (
                            <span className="color-weak">
                                {' - '}
                                {c('emergency_access').t`Trusted contact`}
                            </span>
                        )}
                    </div>
                    {sessionDisplayData.showEmail && (
                        <div className="text-break color-weak text-ellipsis">{sessionDisplayData.email}</div>
                    )}
                </a>
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
                <IcArrowRight className="account-button-icon my-auto rtl:mirror" aria-hidden="true" />
            )}
        </div>
    );
};

const SwitchAccountContainer = () => {
    const history = useHistory();
    const publicApp = PublicAppContext.useActorRef();
    const { createNotification } = useNotifications();
    const activeSessions = PublicAppContext.useSelector((state) => state.context.activeSessions);
    const sessionsFailed = PublicAppContext.useSelector((state) => state.context.sessionsFailed);
    const initialSessionsLength = PublicAppContext.useSelector((state) => state.context.initialSessionsLength);
    const loginPath = PublicAppContext.useSelector((state) => selectPaths(state).login);
    const toApp = PublicAppContext.useSelector(selectPreAppIntent);
    const toAppName = PublicAppContext.useSelector(selectToAppName);
    const signingInLocalID = PublicAppContext.useSelector(selectSigningInLocalID);
    const onPickSession = (localID: number) => publicApp.send({ type: 'session.picked', localID });
    const onAddAccount = () => history.push(loginPath);

    useMetaTags(getLoginMeta(toApp));

    const [confirmSignOutModalProps, setConfirmSignOutModalOpen, renderConfirmSignOutModal] = useModalState();
    const [tmpConfirmSignOutState, setTmpConfirmSignOutState] = useState<{
        confirmType: ConfirmSignoutModalProps['confirmType'];
        sessions: ActiveSession[];
    }>({ confirmType: 'single', sessions: [] });

    useEffect(() => {
        publicApp.send({ type: 'switch.opened' });
    }, []);

    useEffect(() => {
        const subscription = publicApp.on('session.expired', () =>
            createNotification({
                type: 'error',
                text: c('Error').t`The session has expired. Please sign in again.`,
            })
        );
        return () => subscription.unsubscribe();
    }, [publicApp, createNotification]);

    const handleSignOutMultiple = useCallback((activeSessions: ActiveSession[], type: 'all' | 'single') => {
        let confirmType: (typeof tmpConfirmSignOutState)['confirmType'];
        if (activeSessions.some((session) => getHasRecoveryMessage(session.remote.UserID))) {
            confirmType = 'recoveryMessage';
        } else if (type === 'all' && activeSessions.length > 1) {
            confirmType = 'all';
        } else {
            confirmType = 'single';
        }
        setTmpConfirmSignOutState({ sessions: activeSessions, confirmType });
        setConfirmSignOutModalOpen(true);
    }, []);

    const inner = () => {
        if (sessionsFailed) {
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

        if (!activeSessions) {
            return (
                <div className="flex flex-column gap-2">
                    {new Array(clamp(initialSessionsLength, 1, 4)).fill(0).map((_, idx) => {
                        return <SkeletonLoader key={idx} width="100%" height="6em" index={0} />;
                    })}
                </div>
            );
        }

        if (!activeSessions.length) {
            return <div className="mb-4">{c('Error').t`No active sessions`}</div>;
        }

        return [...activeSessions].sort(compareSessions).map((session, index) => {
            const sessionDisplayData = getSessionDisplayData(session);
            const localID = sessionDisplayData.localID;
            const isLoading = signingInLocalID === localID;

            return (
                <Fragment key={localID}>
                    <AccountItem
                        href={
                            toApp
                                ? getAppHref('', toApp, session.persisted.localID)
                                : getAppHref(
                                      `${SSO_PATHS.APP_SWITCHER}?u=${session.persisted.localID}`,
                                      APPS.PROTONACCOUNT
                                  )
                        }
                        onClick={onPickSession}
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
                    <Button size="large" color="weak" shape="outline" fullWidth onClick={onAddAccount}>
                        {c('Action').t`Add ${BRAND_NAME} Account`}
                    </Button>
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
                {renderConfirmSignOutModal && (
                    <ConfirmSignOutModal
                        confirmType={tmpConfirmSignOutState.confirmType}
                        onSignOut={(clearData) => {
                            publicApp.send({
                                type: 'sessions.signedOut',
                                sessions: tmpConfirmSignOutState.sessions,
                                clearDeviceRecovery: clearData,
                            });
                        }}
                        {...confirmSignOutModalProps}
                        onExit={() => {
                            setTmpConfirmSignOutState({ sessions: [], confirmType: 'single' });
                            confirmSignOutModalProps.onExit();
                        }}
                    />
                )}
            </Content>
        </Main>
    );
    return <Layout toApp={toApp}>{children}</Layout>;
};

export default SwitchAccountContainer;
