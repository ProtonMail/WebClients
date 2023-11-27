import { type FC, useMemo } from 'react';

import { c } from 'ttag';

import { type IconName } from '@proton/components/components';
import { useNavigation } from '@proton/pass/components/Core/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Core/routing';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';

type SettingAction = { key: string; label: string; icon: IconName };

export const SettingsDropdown: FC = () => {
    const { navigate } = useNavigation();

    const settings = useMemo<SettingAction[]>(
        () => [
            { key: 'security', label: c('Label').t`Security`, icon: 'locks' },
            { key: 'support', label: c('Label').t`Support`, icon: 'speech-bubble' },
        ],
        []
    );

    return (
        <QuickActionsDropdown icon="cog-wheel" size="small" shape="ghost" className="flex-item-noshrink ml-1">
            {settings.map((setting) => (
                <DropdownMenuButton
                    key={setting.key}
                    onClick={() => navigate(getLocalPath('settings'), { mode: 'push', hash: setting.key })}
                    label={setting.label}
                    ellipsis={false}
                    icon={setting.icon}
                />
            ))}
        </QuickActionsDropdown>
    );
};
