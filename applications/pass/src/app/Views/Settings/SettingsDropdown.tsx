import { type FC, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { NotificationDot } from '@proton/atoms/NotificationDot';
import { type IconName } from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { AccountPath } from '@proton/pass/constants';
import { useNavigateToAccount } from '@proton/pass/hooks/useNavigateToAccount';
import { useNotificationEnhancer } from '@proton/pass/hooks/useNotificationEnhancer';
import { selectOfflineEnabled } from '@proton/pass/store/selectors';

import { useAuthService } from '../../Context/AuthServiceProvider';

type SettingAction = { icon: IconName; key: string; label: string; signaled?: boolean; onClick?: () => void };

export const SettingsDropdown: FC = () => {
    const { navigate } = useNavigation();
    const { createNotification, clearNotifications } = useNotifications();
    const enhance = useNotificationEnhancer();
    const authService = useAuthService();
    const orgEnabled = useOrganization()?.settings.enabled ?? false;
    const offlineEnabled = useSelector(selectOfflineEnabled);
    const offlineSignaled = !offlineEnabled;

    const navigateToAccount = useNavigateToAccount(AccountPath.ACCOUNT_PASSWORD);

    const onLogout = useCallback(async () => {
        createNotification(enhance({ text: c('Info').t`Logging you out...`, type: 'info', loading: true }));
        await authService.logout({ soft: false });
        clearNotifications();
    }, []);

    const settings = useMemo<SettingAction[]>(
        () => [
            { key: 'general', label: c('Label').t`General`, icon: 'cog-wheel' },
            { key: 'security', label: c('Label').t`Security`, icon: 'locks', signaled: offlineSignaled },
            { key: 'import', label: c('Label').t`Import`, icon: 'arrow-up-line' },
            { key: 'export', label: c('Label').t`Export`, icon: 'arrow-down-line' },
            { key: 'account', label: c('Label').t`Account`, icon: 'arrow-out-square', onClick: navigateToAccount },
            ...(orgEnabled
                ? [{ key: 'organization', label: c('Label').t`Organization`, icon: 'buildings' } as const]
                : []),
            { key: 'support', label: c('Label').t`Support`, icon: 'speech-bubble' },
            { key: 'logout', label: c('Action').t`Sign out`, icon: 'arrow-out-from-rectangle', onClick: onLogout },
        ],
        [offlineSignaled, orgEnabled]
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
