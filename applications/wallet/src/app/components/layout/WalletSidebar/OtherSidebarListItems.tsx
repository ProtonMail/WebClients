import type { ReactNode } from 'react';

import { c } from 'ttag';

import { signoutAction } from '@proton/account';
import type { IconProps } from '@proton/components/components';
import {
    SettingsLink,
    SidebarExpandButton,
    SidebarListItem,
    SidebarListItemButton,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemSettingsLink,
    useModalState,
} from '@proton/components/components';
import { AuthenticatedBugModal } from '@proton/components/containers';
import { useToggle } from '@proton/components/hooks';
import { useDispatch } from '@proton/redux-shared-store';

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
                className="sidebar-item-content flex gap-2 max-w-full"
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
    const { state: showSettings, toggle: toggleShowSettings } = useToggle(false);
    const [bugReportModal, setBugReportModal, renderBugReportModal] = useModalState();

    const handleSignout = (clearDeviceRecovery: boolean) => {
        dispatch(signoutAction({ clearDeviceRecovery }));
    };

    const handleSignOutClick = () => {
        handleSignout(false);
    };

    const recoveryLabel = c('Wallet Sidebar').t`Recovery`;
    const upgradeLabel = c('Wallet Sidebar').t`Upgrade`;
    const securityLabel = c('Wallet Sidebar').t`Security`;
    const settingsLabel = c('Wallet Sidebar').t`User settings`;
    const supportLabel = c('Wallet Sidebar').t`Contact Support`;
    const signoutLabel = c('Wallet Sidebar').t`Sign out`;

    return (
        <>
            <SidebarListItem className="my-2">
                <SidebarItemContent
                    icon="upgrade"
                    to="/upgrade"
                    data-testid="wallet-sidebar:upgrade"
                    label={upgradeLabel}
                />
            </SidebarListItem>
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
