import type { FC, MouseEventHandler, ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useAuthService } from 'proton-pass-web/app/Auth/AuthServiceProvider';
import { c } from 'ttag';

import { NotificationDot } from '@proton/atoms';
import { type IconName, useNotifications } from '@proton/components';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { AccountPath } from '@proton/pass/constants';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useNavigateToAccount } from '@proton/pass/hooks/useNavigateToAccount';
import { useNotificationEnhancer } from '@proton/pass/hooks/useNotificationEnhancer';
import { useOfflineSupported } from '@proton/pass/hooks/useOfflineSupported';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { selectOfflineEnabled, selectPassPlan } from '@proton/pass/store/selectors';
import { PassFeature } from '@proton/pass/types/api/features';

type MenuAction = {
    icon: IconName;
    key: string;
    label: string;
    subMenu?: ReactNode;
    signaled?: boolean;
    onClick?: MouseEventHandler;
};

export const MenuActions: FC = () => {
    const { navigate } = useNavigation();
    const { createNotification, clearNotifications } = useNotifications();
    const enhance = useNotificationEnhancer();
    const authService = useAuthService();
    const orgEnabled = useOrganization()?.settings.enabled ?? false;
    const aliasesEnabled = useFeatureFlag(PassFeature.PassSimpleLoginAliasesSync);
    const plan = useSelector(selectPassPlan);
    const offlineEnabled = useSelector(selectOfflineEnabled);
    const offlineSignaled = useOfflineSupported() && !offlineEnabled && isPaidPlan(plan);

    const navigateToAccount = useNavigateToAccount(AccountPath.ACCOUNT_PASSWORD);
    const navigateToOrganization = useNavigateToAccount(AccountPath.POLICIES);

    const onLogout = useCallback(async () => {
        createNotification(enhance({ text: c('Info').t`Logging you out...`, type: 'info', loading: true }));
        await authService.logout({ soft: false });
        clearNotifications();
    }, []);

    const settings = useMemo<MenuAction[]>(
        () => [
            { key: 'general', label: c('Label').t`General`, icon: 'cog-wheel', signaled: offlineSignaled },
            ...(aliasesEnabled ? [{ key: 'aliases', label: c('Label').t`Aliases`, icon: 'alias' } as const] : []),
            { key: 'security', label: c('Label').t`Security`, icon: 'locks' },
            { key: 'import', label: c('Label').t`Import`, icon: 'arrow-down-line' },
            { key: 'export', label: c('Label').t`Export`, icon: 'arrow-up-line' },
            { key: 'account', label: c('Label').t`Account`, icon: 'arrow-out-square', onClick: navigateToAccount },
            ...(orgEnabled
                ? [
                      {
                          key: 'organization',
                          label: c('Label').t`Organization`,
                          icon: 'buildings',
                          onClick: navigateToOrganization,
                      } as const,
                  ]
                : []),
            { key: 'support', label: c('Label').t`Support`, icon: 'speech-bubble' },
            { key: 'logout', label: c('Action').t`Sign out`, icon: 'arrow-out-from-rectangle', onClick: onLogout },
        ],
        [offlineSignaled, orgEnabled, aliasesEnabled]
    );

    return (
        <>
            <QuickActionsDropdown
                icon="cog-wheel"
                size="small"
                shape="ghost"
                className="shrink-0"
                signaled={offlineSignaled}
            >
                {settings.map((setting) => (
                    <DropdownMenuButton
                        key={setting.key}
                        className="relative"
                        ellipsis={false}
                        icon={setting.icon}
                        onClick={setting.onClick ?? (() => navigate(getLocalPath('settings'), { hash: setting.key }))}
                        label={
                            <div className="flex items-center gap-3">
                                <span className="flex-1 flex-nowrap">{setting.label}</span>
                                {setting.signaled && <NotificationDot className="w-2 h-2" />}
                            </div>
                        }
                    />
                ))}
            </QuickActionsDropdown>
        </>
    );
};
