import { type FC, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { NotificationDot } from '@proton/atoms';
import { type IconName } from '@proton/components';
import { useNotifications } from '@proton/components/hooks';
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

import { useAuthService } from '../../Context/AuthServiceProvider';

type SettingAction = { icon: IconName; key: string; label: string; signaled?: boolean; onClick?: () => void };

export const SettingsDropdown: FC = () => {
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

    const settings = useMemo<SettingAction[]>(
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
        <QuickActionsDropdown
            icon="cog-wheel"
            size="small"
            shape="ghost"
            className="shrink-0 ml-1"
            signaled={offlineSignaled}
        >
            {settings.map((setting) => (
                <DropdownMenuButton
                    key={setting.key}
                    onClick={setting.onClick ?? (() => navigate(getLocalPath('settings'), { hash: setting.key }))}
                    label={
                        <div className="flex items-center gap-3">
                            <span className="flex-1">{setting.label}</span>
                            {setting.signaled && <NotificationDot className="w-2 h-2" />}
                        </div>
                    }
                    ellipsis={false}
                    icon={setting.icon}
                    className="relative"
                ></DropdownMenuButton>
            ))}
        </QuickActionsDropdown>
    );
};
