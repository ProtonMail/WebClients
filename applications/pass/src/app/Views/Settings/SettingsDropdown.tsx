import { type FC, useCallback, useMemo } from 'react';

import { c } from 'ttag';

import { type IconName } from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useNotificationEnhancer } from '@proton/pass/hooks/useNotificationEnhancer';

import { useAuthService } from '../../Context/AuthServiceProvider';

type SettingAction = { key: string; label: string; icon: IconName };

export const SettingsDropdown: FC = () => {
    const { navigate } = useNavigation();
    const { createNotification, clearNotifications } = useNotifications();
    const enhance = useNotificationEnhancer();
    const authService = useAuthService();

    const settings = useMemo<SettingAction[]>(
        () => [
            { key: 'security', label: c('Label').t`Security`, icon: 'locks' },
            { key: 'import', label: c('Label').t`Import`, icon: 'arrow-up-line' },
            { key: 'export', label: c('Label').t`Export`, icon: 'arrow-down-line' },
            { key: 'support', label: c('Label').t`Support`, icon: 'speech-bubble' },
        ],
        []
    );

    const onLogout = useCallback(async () => {
        createNotification(enhance({ text: c('Info').t`Logging you out...`, type: 'info', loading: true }));
        await authService.logout({ soft: false });
        clearNotifications();
    }, []);

    return (
        <QuickActionsDropdown icon="cog-wheel" size="small" shape="ghost" className="shrink-0 ml-1">
            {settings.map((setting) => (
                <DropdownMenuButton
                    key={setting.key}
                    onClick={() => navigate(getLocalPath('settings'), { hash: setting.key })}
                    label={setting.label}
                    ellipsis={false}
                    icon={setting.icon}
                />
            ))}
            <DropdownMenuButton icon="arrow-out-from-rectangle" label={c('Action').t`Sign out`} onClick={onLogout} />
        </QuickActionsDropdown>
    );
};
