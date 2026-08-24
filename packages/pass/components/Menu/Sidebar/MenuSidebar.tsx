import type { FC, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Scroll } from '@proton/atoms/Scroll/Scroll';
import { IcPlus } from '@proton/icons/icons/IcPlus';

import { useVaultCreationPolicy } from '../../../hooks/organization/useVaultCreationPolicy';
import { useMenuItems } from '../../../hooks/useMenuItems';
import { UserStorage } from '../../Account/UserStorage';
import { RouteMatch } from '../../Navigation/RouteMatch';
import { getMonitorRoute } from '../../Navigation/routing';
import { InAppNotificationContainer } from '../../Notifications/InAppNotificationPortal';
import { OrganizationPolicyTooltip } from '../../Organization/OrganizationPolicyTooltip';
import { useVaultActions } from '../../Vault/VaultActionsProvider';
import { MonitorButton } from '../Monitor/MonitorButton';
import { SharedMenu } from '../Shared/SharedMenu';
import { Submenu } from '../Submenu';
import { VaultMenu } from '../Vault/VaultMenu';
import { AuthActions } from './AuthActions';
import { MenuActions } from './MenuActions';
import { OnboardingActions } from './OnboardingActions';
import { OrganizationActions } from './OrganizationActions';

type Props = {
    onLock: () => void;
    onLogout: (options: { soft: boolean }) => void;
    userPanel: ReactNode;
};

export const MenuSidebar: FC<Props> = ({ onLock, onLogout, userPanel }) => {
    const menu = useMenuItems();
    const vaultActions = useVaultActions();
    const { vaultCreationDisabled } = useVaultCreationPolicy();

    return (
        <div className="flex flex-column flex-nowrap justify-space-between flex-1 overflow-auto">
            <Scroll className="flex-1 h-1/2 min-h-custom" style={{ '--min-h-custom': '5em' }}>
                <div className="flex flex-column mx-3 gap-5 pb-2">
                    <div className="flex flex-column w-full">
                        <OrganizationPolicyTooltip
                            enforced={vaultCreationDisabled}
                            text={c('Warning').t`Your organization does not allow creating a vault`}
                            placement="right"
                        >
                            <Button
                                icon
                                size="medium"
                                color="norm"
                                onClick={vaultActions.create}
                                shape="ghost"
                                title={c('Action').t`Create a new vault`}
                                className="flex items-center justify-space-between flex-nowrap py-2 pl-3 px-2 w-full"
                                disabled={vaultCreationDisabled}
                            >
                                <span className="block text-ellipsis">{c('Label').t`Vaults`}</span>
                                <IcPlus alt={c('Action').t`Create a new vault`} className="shrink-0" />
                            </Button>
                        </OrganizationPolicyTooltip>
                        <VaultMenu />
                    </div>

                    <SharedMenu />
                </div>
            </Scroll>

            <div className="flex flex-column flex-nowrap pb-2 shrink-0">
                <hr className="mb-2 mx-4" aria-hidden="true" />

                <OnboardingActions />

                <RouteMatch path={getMonitorRoute()} component={MonitorButton} />

                <OrganizationActions />

                <hr className="my-2 mx-4" aria-hidden="true" />

                <AuthActions onLock={onLock} />

                <Submenu
                    icon="bolt"
                    label={c('Action').t`Advanced`}
                    items={menu.advanced}
                    headerClassname="mx-3 pr-2 py-1"
                    contentClassname="mx-3"
                />
                <Submenu
                    icon="mobile"
                    label={
                        DESKTOP_BUILD
                            ? c('Action').t`Get mobile apps`
                            : // translator: if the translated text is longer than the english text,
                              // please simply translate as "Get apps" because UI space is limited.
                              c('Action').t`Get mobile and desktop apps`
                    }
                    items={menu.download}
                    headerClassname="mx-3 pr-2 py-1"
                    contentClassname="mx-3"
                />

                <div className="shrink-0">
                    <InAppNotificationContainer className="px-4 py-2" />

                    <hr className="my-2 mx-4" aria-hidden="true" />

                    <div className="flex justify-space-between items-center flex-nowrap gap-1 pl-3 pr-5">
                        {userPanel}
                        <MenuActions onLogout={onLogout} />
                    </div>

                    <UserStorage />
                </div>
            </div>
        </div>
    );
};
