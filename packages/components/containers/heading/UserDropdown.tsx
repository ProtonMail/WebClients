import { type MouseEvent, useCallback, useEffect, useMemo } from 'react';

import { getLoginHref, getSwitchHref, handleSwitchAccountFork } from '@proton/account/accountSessions/sessionsHelper';
import { selectSessionRecoveryData } from '@proton/account/recovery/sessionRecoverySelectors';
import ConfirmSignOutModal, {
    shouldShowConfirmSignOutModal,
} from '@proton/components/components/confirmSignOutModal/ConfirmSignOutModal';
import ConfirmSignOutAllModal from '@proton/components/components/confirmSignOutModal/ConfirmSignoutAllModal';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import SessionRecoverySignOutConfirmPrompt from '@proton/components/containers/account/sessionRecovery/SessionRecoverySignOutConfirmPrompt';
import type AccountSessionsSwitcher from '@proton/components/containers/heading/AccountSessionsSwitcher';
import AuthenticatedBugModal from '@proton/components/containers/support/AuthenticatedBugModal';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import type { ForkType } from '@proton/shared/lib/authentication/fork';
import type { ExtraSessionForkData } from '@proton/shared/lib/authentication/interface';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { hasInboxDesktopFeature } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { getShouldProcessLinkClick } from '@proton/shared/lib/helpers/dom';
import { useFlag } from '@proton/unleash/useFlag';

import HelpModal from '../support/HelpModal';
import SelfHelpModal from '../support/SelfHelpModal';
import UserDropdownButton, { type Props as UserDropdownButtonProps } from './UserDropdownButton';
import UserDropdownContent from './UserDropdownContent';
import { UserDropdownContext, type UserDropdownValue } from './UserDropdownContext';
import { useUserDropdownInfo } from './useUserDropdownInfo';

interface UserDropdownProps extends Omit<UserDropdownButtonProps, 'user' | 'isOpen' | 'onClick'> {
    onOpenChat?: () => void;
    app: APP_NAMES;
    hasAppLinks?: boolean;
    sessionOptions?: Parameters<typeof AccountSessionsSwitcher>[0]['sessionOptions'];
    logoutRedirectUrl?: string;
    extraSessionForkData?: ExtraSessionForkData;
    reportDescriptionContext?: string[];
}

const ALLOWED_APPS_FOR_SELF_TROUBLESHOOT: Partial<APP_NAMES>[] = [
    APPS.PROTONMAIL,
    APPS.PROTONCALENDAR,
    APPS.PROTONACCOUNT,
];

const UserDropdown = ({
    dropdownIcon,
    app,
    onOpenChat,
    sessionOptions,
    hasAppLinks,
    logoutRedirectUrl,
    extraSessionForkData,
    reportDescriptionContext,
    ...rest
}: UserDropdownProps) => {
    const { APP_NAME, user, info, upgrade, referral, accountSessions } = useUserDropdownInfo({ app });
    const authentication = useAuthentication();

    const { anchorRef, isOpen, toggle, close: closeUserDropdown } = usePopperAnchor<HTMLButtonElement>();

    const [bugReportModal, setBugReportModal, renderBugReportModal] = useModalState();
    const [selfHelpModal, setSelfHelpModal, renderSelfHelpModal] = useModalState();
    const [confirmSignOutModal, setConfirmSignOutModal, renderConfirmSignOutModal] = useModalState();
    const [openSignOutAllPrompt, setOpenSignOutAllPrompt, renderOpenSignOutAllPrompt] = useModalState();

    /* Enable for calendar, account and mail */
    const isSelfTroubleshoot = useFlag('SelfTroubleshoot') && ALLOWED_APPS_FOR_SELF_TROUBLESHOOT.includes(app);

    const [
        sessionRecoverySignOutConfirmPrompt,
        setSessionRecoverySignOutConfirmPrompt,
        renderSessionRecoverySignOutConfirmPrompt,
    ] = useModalState();
    const [helpModal, setHelpModal, renderHelpModal] = useModalState();

    const handleSignOut = (clearDeviceRecovery: boolean) => {
        accountSessions.actions.signOut({ clearDeviceRecovery, logoutRedirectUrl });
    };

    const { switchHref, loginHref } = useMemo(() => {
        return { switchHref: getSwitchHref(app), loginHref: getLoginHref(app) };
    }, [app]);

    const handleSwitchAccount = useCallback(
        (event: MouseEvent<HTMLAnchorElement>, forkType: ForkType) => {
            const target = event.currentTarget?.getAttribute('target') || '';
            if (APP_NAME !== APPS.PROTONACCOUNT && getShouldProcessLinkClick(event.nativeEvent, target)) {
                event.preventDefault();
                handleSwitchAccountFork(app, forkType, extraSessionForkData);
            }
        },
        [app, extraSessionForkData]
    );

    const { sessionRecoveryInitiated } = useSelector(selectSessionRecoveryData);

    const handleSignOutClick = (
        {
            ignoreSessionRecovery,
        }: {
            ignoreSessionRecovery: boolean;
        } = { ignoreSessionRecovery: false }
    ) => {
        closeUserDropdown();
        if (sessionRecoveryInitiated && !ignoreSessionRecovery) {
            setSessionRecoverySignOutConfirmPrompt(true);
        } else if (shouldShowConfirmSignOutModal({ user, authentication })) {
            setConfirmSignOutModal(true);
        } else {
            handleSignOut(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            accountSessions.actions.ping();
        }
    }, [isOpen]);

    const inboxDesktopMultiAccountSupport = useFlag('InboxDesktopMultiAccountSupport');
    const showSwitchAccountButton =
        isElectronApp && authentication.mode === 'sso'
            ? inboxDesktopMultiAccountSupport && hasInboxDesktopFeature('MultiAccount')
            : authentication.mode === 'sso';

    const value: UserDropdownValue = {
        referral,
        upgrade,
        info,
        onSignOut: handleSignOutClick,
        onOpenBugReportModal: () => {
            if (isSelfTroubleshoot) {
                setSelfHelpModal(true);
            } else {
                setBugReportModal(true);
            }
            closeUserDropdown();
        },
        onOpenSignoutAll: () => setOpenSignOutAllPrompt(true),
        onOpenHelpModal: () => setHelpModal(true),
        accountSessions,
        onSwitchAccount: handleSwitchAccount,
        switchHref,
        loginHref,
        isOpen,
        closeUserDropdown,
        app,
        anchorRef,
        onOpenChat,
        sessionOptions,
        hasAppLinks,
        showSwitchAccountButton,
    };

    return (
        <UserDropdownContext.Provider value={value}>
            {renderBugReportModal && (
                <AuthenticatedBugModal
                    {...bugReportModal}
                    app={app}
                    reportDescriptionContext={reportDescriptionContext}
                />
            )}
            {renderSelfHelpModal && (
                <SelfHelpModal
                    open={selfHelpModal.open}
                    onClose={selfHelpModal.onClose}
                    onExit={selfHelpModal.onExit}
                    onBugReportClick={() => setBugReportModal(true)}
                    app={app}
                />
            )}
            {renderSessionRecoverySignOutConfirmPrompt && (
                <SessionRecoverySignOutConfirmPrompt
                    onSignOut={() => handleSignOutClick({ ignoreSessionRecovery: true })}
                    {...sessionRecoverySignOutConfirmPrompt}
                />
            )}
            {renderConfirmSignOutModal && <ConfirmSignOutModal onSignOut={handleSignOut} {...confirmSignOutModal} />}
            {renderOpenSignOutAllPrompt && (
                <ConfirmSignOutAllModal
                    onSignOut={() => {
                        accountSessions.actions.signOutAll(accountSessions.state.value, logoutRedirectUrl);
                    }}
                    {...openSignOutAllPrompt}
                />
            )}
            {renderHelpModal && (
                <HelpModal {...helpModal} APP_NAME={APP_NAME} onOpenBugModal={value.onOpenBugReportModal} />
            )}
            <UserDropdownButton
                data-testid="heading:userdropdown"
                {...rest}
                user={user}
                ref={anchorRef}
                isOpen={isOpen}
                dropdownIcon={dropdownIcon}
                onClick={() => {
                    toggle();
                }}
            />
            <UserDropdownContent />
        </UserDropdownContext.Provider>
    );
};

export default UserDropdown;
