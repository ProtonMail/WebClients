import type { MouseEvent } from 'react';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import UserDropdownButton, {
    type Props as UserDropdownButtonProps,
} from '@proton/components/containers/heading/UserDropdownButton';
import { UserDropdownContext, type UserDropdownValue } from '@proton/components/containers/heading/UserDropdownContext';
import { useUserDropdownInfo } from '@proton/components/containers/heading/useUserDropdownInfo';
import AuthenticatedBugModal from '@proton/components/containers/support/AuthenticatedBugModal';
import HelpModal from '@proton/components/containers/support/HelpModal';
import type { ForkType } from '@proton/shared/lib/authentication/fork';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import { useLumoAuthAction } from '../../hooks/useLumoAuthAction';
import LumoUserDropdownContent from './LumoUserDropdownContent';

interface LumoUserDropdownProps extends Omit<UserDropdownButtonProps, 'user' | 'isOpen' | 'onClick'> {
    onOpenChat?: () => void;
    app: APP_NAMES;
    hasAppLinks?: boolean;
    reportDescriptionContext?: string[];
}

const noopSwitchAccount = (_event: MouseEvent<HTMLAnchorElement>, _forkType: ForkType) => {};

const LumoUserDropdown = ({
    dropdownIcon,
    app,
    onOpenChat,
    hasAppLinks,
    reportDescriptionContext,
    ...rest
}: LumoUserDropdownProps) => {
    const { APP_NAME, user, info, upgrade, referral, accountSessions } = useUserDropdownInfo({ app });
    const { trigger } = useLumoAuthAction();

    const { anchorRef, isOpen, toggle, close: closeUserDropdown } = usePopperAnchor<HTMLButtonElement>();

    const [bugReportModal, setBugReportModal, renderBugReportModal] = useModalState();
    const [helpModal, setHelpModal, renderHelpModal] = useModalState();

    const handleSignOutClick = () => {
        closeUserDropdown();
        trigger('signout');
    };

    const value: UserDropdownValue = {
        referral: { ...referral, visible: false },
        upgrade,
        info,
        onSignOut: handleSignOutClick,
        onOpenBugReportModal: () => {
            setBugReportModal(true);
            closeUserDropdown();
        },
        onOpenSignoutAll: () => {},
        onOpenHelpModal: () => setHelpModal(true),
        accountSessions,
        onSwitchAccount: noopSwitchAccount,
        switchHref: '',
        loginHref: '',
        isOpen,
        closeUserDropdown,
        app,
        anchorRef,
        onOpenChat,
        hasAppLinks,
        showSwitchAccountButton: false,
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
            <LumoUserDropdownContent />
        </UserDropdownContext.Provider>
    );
};

export default LumoUserDropdown;
