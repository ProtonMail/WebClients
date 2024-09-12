import type { ReactNode } from 'react';

import { c } from 'ttag';

import { signoutAction } from '@proton/account';
import type { IconProps } from '@proton/components';
import {
    AuthenticatedBugModal,
    SUBSCRIPTION_STEPS,
    SettingsLink,
    SidebarExpandButton,
    SidebarListItem,
    SidebarListItemButton,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
    SidebarListItemSettingsLink,
    useModalState,
    useSubscriptionModal,
} from '@proton/components';
import { useOrganization, useToggle, useUser } from '@proton/components/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { PLANS } from '@proton/shared/lib/constants';

import { APP_NAME } from '../../../config';

interface Props {
    label: string;
    to: string;
    icon: IconProps['name'];
    'data-testid'?: string;
    children?: ReactNode;
}

const SidebarItemContent = ({ label, to, icon, ...props }: Props) => {
    return (
        <SidebarListItemSettingsLink path={to} target="_blank">
            <SidebarListItemContent
                data-testid={props['data-testid']}
                left={<SidebarListItemContentIcon size={5} className="color-weak" name={icon} />}
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
    const [openSubscriptionModal] = useSubscriptionModal();

    const [organization, isLoadingOrganization] = useOrganization();
    const [user] = useUser();

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

    return (
        <>
            <SidebarListItem>
                <SidebarListItemLink to={'/discover'}>
                    <SidebarListItemContent
                        data-testid="wallet-sidebar:discover"
                        left={<SidebarListItemContentIcon size={5} className="color-weak" name="squares-in-square" />}
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
            {organization?.PlanName !== PLANS.VISIONARY && !isLoadingOrganization && user.canPay && (
                <SidebarListItem className="my-2">
                    <SidebarListItemButton
                        data-testid="wallet-sidebar:upgrade"
                        onClick={() => {
                            openSubscriptionModal({
                                step: SUBSCRIPTION_STEPS.CHECKOUT,
                                disablePlanSelection: true,
                                plan: PLANS.VISIONARY,
                                metrics: {
                                    source: 'upsells',
                                },
                            });
                        }}
                    >
                        <SidebarListItemContent
                            left={<SidebarListItemContentIcon size={5} className="color-weak" name={'upgrade'} />}
                            className="sidebar-item-content flex gap-2 max-w-full"
                        >
                            <div className="block text-ellipsis" title={upgradeLabel}>
                                {upgradeLabel}
                            </div>
                        </SidebarListItemContent>
                    </SidebarListItemButton>
                </SidebarListItem>
            )}
            <SidebarListItem className="my-2">
                <SidebarListItemSettingsLink path={'/'} target="_blank">
                    <SidebarListItemContent
                        data-testid="wallet-sidebar:settings"
                        left={<SidebarListItemContentIcon size={5} className="color-weak" name="user" />}
                        right={
                            <SidebarExpandButton
                                className="wallet-expand-button color-hint"
                                size={4}
                                title={c('Wallet Sidebar').t`Expand user settings`}
                                expanded={showSettings}
                                onClick={() => toggleShowSettings()}
                                pill
                                iconCollapsed="chevron-down"
                                iconExpanded="chevron-up"
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
                                icon="arrow-rotate-right"
                                to="/recovery"
                                data-testid="wallet-sidebar:recovery"
                                label={recoveryLabel}
                            />
                        </SidebarListItem>
                        <SidebarListItem itemClassName={'navigation-item w-full mb-0.5 my-2'}>
                            <SidebarItemContent
                                icon="shield-2"
                                to="/security"
                                data-testid="wallet-sidebar:security"
                                label={securityLabel}
                            >
                                <SettingsLink path="/" app={APP_NAME} />
                            </SidebarItemContent>
                        </SidebarListItem>
                    </ul>
                )}
            </SidebarListItem>
            <SidebarListItem className="my-2">
                <SidebarListItemButton onClick={() => setBugReportModal(true)}>
                    <SidebarListItemContent
                        data-testid="wallet-sidebar:support"
                        left={<SidebarListItemContentIcon className="color-weak" size={5} name="life-ring" />}
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
                                className="color-weak"
                                size={5}
                                name="arrow-out-from-rectangle"
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
