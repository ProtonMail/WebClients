import { type MouseEvent, useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { useAccountSessions } from '@proton/account/accountSessions';
import { getLoginHref, getSwitchHref, handleSwitchAccountFork } from '@proton/account/accountSessions/sessionsHelper';
import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import ConfirmSignOutModal, {
    shouldShowConfirmSignOutModal,
} from '@proton/components/components/confirmSignOutModal/ConfirmSignOutModal';
import ConfirmSignOutAllModal from '@proton/components/components/confirmSignOutModal/ConfirmSignoutAllModal';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import SessionRecoverySignOutConfirmPrompt from '@proton/components/containers/account/sessionRecovery/SessionRecoverySignOutConfirmPrompt';
import type AccountSessionsSwitcher from '@proton/components/containers/heading/AccountSessionsSwitcher';
import { useReferral } from '@proton/components/containers/heading/useReferral';
import { ReferralSpotlight } from '@proton/components/containers/referral/ReferralSpotlight';
import AuthenticatedBugModal from '@proton/components/containers/support/AuthenticatedBugModal';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import useConfig from '@proton/components/hooks/useConfig';
import { useSessionRecoveryState } from '@proton/components/hooks/useSessionRecoveryState';
import { getSubscriptionPlanTitleAndName } from '@proton/payments';
import type { ForkType } from '@proton/shared/lib/authentication/fork';
import { APPS, type APP_NAMES, SHARED_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { hasInboxDesktopFeature } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { getShouldProcessLinkClick } from '@proton/shared/lib/helpers/dom';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { isTrial } from '@proton/shared/lib/helpers/subscription';
import { addUpsellPath, getUpgradePath, getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';
import { SessionRecoveryState } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash/index';

import HelpModal from '../support/HelpModal';
import SelfHelpModal from '../support/SelfHelpModal';
import UserDropdownButton, { type Props as UserDropdownButtonProps } from './UserDropdownButton';
import { UserDropdownContext, type UserDropdownValue } from './UserDropdownContext';
import UserDropdownV1 from './UserDropdownV1';
import UserDropdownV2 from './UserDropdownV2';

interface UserDropdownProps extends Omit<UserDropdownButtonProps, 'user' | 'isOpen' | 'onClick'> {
    onOpenChat?: () => void;
    app: APP_NAMES;
    hasAppLinks?: boolean;
    sessionOptions?: Parameters<typeof AccountSessionsSwitcher>[0]['sessionOptions'];
}

const ALLOWED_APPS_FOR_SELF_TROUBLESHOOT: Partial<APP_NAMES>[] = [
    APPS.PROTONMAIL,
    APPS.PROTONCALENDAR,
    APPS.PROTONACCOUNT,
];

const UserDropdown = ({ dropdownIcon, app, onOpenChat, sessionOptions, hasAppLinks, ...rest }: UserDropdownProps) => {
    const { APP_NAME } = useConfig();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [organization] = useOrganization();
    const location = useLocation();
    const referral = useReferral(location);
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

    const accountSessions = useAccountSessions();

    const handleSignOut = (clearDeviceRecovery: boolean) => {
        accountSessions.actions.signOut({ clearDeviceRecovery });
    };

    const { switchHref, loginHref } = useMemo(() => {
        return { switchHref: getSwitchHref(app), loginHref: getLoginHref(app) };
    }, [app]);

    const handleSwitchAccount = useCallback((event: MouseEvent<HTMLAnchorElement>, forkType: ForkType) => {
        const target = event.currentTarget?.getAttribute('target') || '';
        if (APP_NAME !== APPS.PROTONACCOUNT && getShouldProcessLinkClick(event.nativeEvent, target)) {
            event.preventDefault();
            handleSwitchAccountFork(app, forkType);
        }
    }, []);

    const sessionRecoveryState = useSessionRecoveryState();
    const sessionRecoveryInitiated =
        sessionRecoveryState === SessionRecoveryState.GRACE_PERIOD ||
        sessionRecoveryState === SessionRecoveryState.INSECURE;

    const handleSignOutClick = () => {
        closeUserDropdown();
        if (sessionRecoveryInitiated) {
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

    const upgradePathname = getUpgradePath({ user, subscription, app: APP_NAME });
    const upsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        feature: SHARED_UPSELL_PATHS.USER_DROPDOWN,
        component: UPSELL_COMPONENT.BUTTON,
        fromApp: app,
    });
    const upgradeUrl = addUpsellPath(upgradePathname, upsellRef);
    const displayUpgradeButton =
        (user.isFree || isTrial(subscription)) && !location.pathname.endsWith(upgradePathname) && !user.hasPassLifetime;

    // nameToDisplay can be falsy for external account
    const nameToDisplay = user.DisplayName || user.Name || '';
    const info: UserDropdownValue['info'] = {
        planName: user.isMember ? '' : getSubscriptionPlanTitleAndName(user, subscription).planTitle,
        name: nameToDisplay,
        email: user.Email,
        // DisplayName is null for VPN users without any addresses, cast to undefined in case Name would be null too.
        initials: getInitials(nameToDisplay || user.Email || ''),
        organizationName: organization?.Name || '',
    };

    const value: UserDropdownValue = {
        referral,
        upgrade: {
            display: displayUpgradeButton,
            url: upgradeUrl,
        },
        info,
        onSignOut: handleSignOutClick,
        onOpenBugReportModal: () => {
            if (isSelfTroubleshoot) {
                setSelfHelpModal(true);
            } else {
                setBugReportModal(true);
            }
            close();
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

    const showNewAccountDropdown = useFlag('UserDropdownRedesign');

    return (
        <UserDropdownContext.Provider value={value}>
            {renderBugReportModal && <AuthenticatedBugModal {...bugReportModal} app={app} />}
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
                    onSignOut={() => handleSignOut(false)}
                    {...sessionRecoverySignOutConfirmPrompt}
                />
            )}
            {renderConfirmSignOutModal && <ConfirmSignOutModal onSignOut={handleSignOut} {...confirmSignOutModal} />}
            {renderOpenSignOutAllPrompt && (
                <ConfirmSignOutAllModal
                    onSignOut={() => {
                        accountSessions.actions.signOutAll(accountSessions.state.value);
                    }}
                    {...openSignOutAllPrompt}
                />
            )}
            {renderHelpModal && (
                <HelpModal {...helpModal} APP_NAME={APP_NAME} onOpenBugModal={value.onOpenBugReportModal} />
            )}
            <ReferralSpotlight
                show={referral.shouldShowSpotlight}
                anchorRef={anchorRef}
                onDisplayed={referral.onDisplayedSpotlight}
                user={user}
            >
                <UserDropdownButton
                    data-testid="heading:userdropdown"
                    {...rest}
                    user={user}
                    ref={anchorRef}
                    isOpen={isOpen}
                    dropdownIcon={dropdownIcon}
                    onClick={() => {
                        referral.onCloseSpotlight();
                        toggle();
                    }}
                />
            </ReferralSpotlight>
            {showNewAccountDropdown ? <UserDropdownV2 /> : <UserDropdownV1 />}
        </UserDropdownContext.Provider>
    );
};

export default UserDropdown;
