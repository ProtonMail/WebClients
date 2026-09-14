import type { ReactNode } from 'react';

import { c } from 'ttag';

import { signoutAction } from '@proton/account';
import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import {
    AuthenticatedBugModal,
    SettingsLink,
    SidebarExpandButton,
    SidebarListItem,
    SidebarListItemButton,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
    SidebarListItemSettingsLink,
    useModalState,
} from '@proton/components';
import useToggle from '@proton/hooks/useToggle';
import type { IconComponent } from '@proton/icons/component';
import { IcArrowOutFromRectangle } from '@proton/icons/icons/IcArrowOutFromRectangle';
import { IcArrowRotateRight } from '@proton/icons/icons/IcArrowRotateRight';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import { IcChevronUp } from '@proton/icons/icons/IcChevronUp';
import { IcLifeRing } from '@proton/icons/icons/IcLifeRing';
import { IcShield2 } from '@proton/icons/icons/IcShield2';
import { IcSquaresInSquare } from '@proton/icons/icons/IcSquaresInSquare';
import { IcUpgrade } from '@proton/icons/icons/IcUpgrade';
import { IcUser } from '@proton/icons/icons/IcUser';
import { PLANS } from '@proton/payments/core/constants';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import clsx from '@proton/utils/clsx';

import config from '../../../config';
import { useUpsellModal } from '../../../hooks/useUpsellModal';

interface Props {
    label: string;
    to: string;
    icon: IconComponent;
    'data-testid'?: string;
    children?: ReactNode;
}

const SidebarItemContent = ({ label, to, icon: Icon, ...props }: Props) => {
    return (
        <SidebarListItemSettingsLink path={to} target="_blank">
            <SidebarListItemContent
                data-testid={props['data-testid']}
                left={<SidebarListItemContentIcon icon={Icon} size={5} className="color-weak" />}
                className="sidebar-item-content flex gap-2 max-w-full pl-6"
            >
                <div className="block text-ellipsis" title={label}>
                    {label}
                </div>
            </SidebarListItemContent>
        </SidebarListItemSettingsLink>
    );
};

export const OtherSidebarListItems = () => {
    const dispatch = useDispatch();

    const [organization, isLoadingOrganization] = useOrganization();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [openUpsellModal] = useUpsellModal(subscription);

    const { state: showSettings, toggle: toggleShowSettings } = useToggle(false);
    const [bugReportModal, setBugReportModal, renderBugReportModal] = useModalState();

    const handleSignout = (clearDeviceRecovery: boolean) => {
        dispatch(signoutAction({ clearDeviceRecovery }));
    };

    const handleSignOutClick = () => {
        handleSignout(false);
    };

    const discoverLabel = c('Wallet Sidebar').t`Discover`;
    const recoveryLabel = c('Wallet Sidebar').t`Recovery`;
    const upgradeLabel = c('Wallet Sidebar').t`Upgrade`;
    const securityLabel = c('Wallet Sidebar').t`Security`;
    const settingsLabel = c('Wallet Sidebar').t`User settings`;
    const supportLabel = c('Wallet Sidebar').t`Contact Support`;
    const signoutLabel = c('Wallet Sidebar').t`Sign out`;

    const canUpgrade = organization?.PlanName !== PLANS.VISIONARY && !isLoadingOrganization && user.canPay;

    return (
        <>
            {canUpgrade && (
                <SidebarListItem>
                    <SidebarListItemButton data-testid="wallet-sidebar:upgrade" onClick={openUpsellModal}>
                        <SidebarListItemContent
                            left={<SidebarListItemContentIcon icon={IcUpgrade} size={5} className="color-weak" />}
                            className="sidebar-item-content flex gap-2 max-w-full"
                        >
                            <div className="block text-ellipsis" title={upgradeLabel}>
                                {upgradeLabel}
                            </div>
                        </SidebarListItemContent>
                    </SidebarListItemButton>
                </SidebarListItem>
            )}
            <SidebarListItem className={clsx(canUpgrade && 'my-2')}>
                <SidebarListItemLink to={'/discover'}>
                    <SidebarListItemContent
                        data-testid="wallet-sidebar:discover"
                        left={<SidebarListItemContentIcon icon={IcSquaresInSquare} size={5} className="color-weak" />}
                        className="sidebar-item-content flex gap-2 max-w-full"
                    >
                        <div className="ml-1 flex flex-nowrap justify-space-between items-center w-full relative">
                            <span className="text-ellipsis" title={discoverLabel}>
                                {discoverLabel}
                            </span>
                        </div>
                    </SidebarListItemContent>
                </SidebarListItemLink>
            </SidebarListItem>
            <SidebarListItem className="my-2">
                <SidebarListItemSettingsLink path={'/'} target="_blank">
                    <SidebarListItemContent
                        data-testid="wallet-sidebar:settings"
                        left={<SidebarListItemContentIcon icon={IcUser} size={5} className="color-weak" />}
                        right={
                            <SidebarExpandButton
                                className="wallet-expand-button color-hint"
                                title={c('Wallet Sidebar').t`Expand user settings`}
                                expanded={showSettings}
                                onClick={() => toggleShowSettings()}
                                pill
                                iconCollapsed={<IcChevronDown size={4} />}
                                iconExpanded={<IcChevronUp size={4} />}
                            />
                        }
                        className="sidebar-item-content flex gap-2 w-full"
                    >
                        <div className="block text-ellipsis" title={settingsLabel}>
                            {settingsLabel}
                        </div>
                    </SidebarListItemContent>
                </SidebarListItemSettingsLink>

                {showSettings && (
                    <ul className="unstyled m-0">
                        <SidebarListItem itemClassName={'navigation-item w-full mb-0.5 my-2'}>
                            <SidebarItemContent
                                icon={IcArrowRotateRight}
                                to="/recovery"
                                data-testid="wallet-sidebar:recovery"
                                label={recoveryLabel}
                            />
                        </SidebarListItem>
                        <SidebarListItem itemClassName={'navigation-item w-full mb-0.5 my-2'}>
                            <SidebarItemContent
                                icon={IcShield2}
                                to="/security"
                                data-testid="wallet-sidebar:security"
                                label={securityLabel}
                            >
                                <SettingsLink path="/" app={config.APP_NAME} />
                            </SidebarItemContent>
                        </SidebarListItem>
                    </ul>
                )}
            </SidebarListItem>
            <SidebarListItem className="my-2">
                <SidebarListItemButton onClick={() => setBugReportModal(true)}>
                    <SidebarListItemContent
                        data-testid="wallet-sidebar:support"
                        left={<SidebarListItemContentIcon icon={IcLifeRing} size={5} className="color-weak" />}
                        className="sidebar-item-content flex gap-2 full"
                    >
                        <div className="block text-ellipsis" title={supportLabel}>
                            {supportLabel}
                        </div>
                    </SidebarListItemContent>
                </SidebarListItemButton>
            </SidebarListItem>
            <SidebarListItem className="my-2">
                <SidebarListItemButton onClick={() => handleSignOutClick()}>
                    <SidebarListItemContent
                        data-testid="wallet-sidebar:signout"
                        left={
                            <SidebarListItemContentIcon
                                icon={IcArrowOutFromRectangle}
                                size={5}
                                className="color-weak"
                            />
                        }
                        className="sidebar-item-content flex gap-2 full"
                    >
                        <div className="block text-ellipsis" title={signoutLabel}>
                            {signoutLabel}
                        </div>
                    </SidebarListItemContent>
                </SidebarListItemButton>
            </SidebarListItem>
            {renderBugReportModal && <AuthenticatedBugModal {...bugReportModal} />}
        </>
    );
};
