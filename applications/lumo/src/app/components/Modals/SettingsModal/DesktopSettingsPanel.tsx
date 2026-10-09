import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { IcArrowWithinSquare } from '@proton/icons/icons/IcArrowWithinSquare';
import { openDesktopSettings } from '@proton/lumo-api-client/core/desktop-tools';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { SettingsSectionItemButton } from './SettingsSectionItem';

type DesktopSettingsPanelProps = {
    onClose?: () => void;
};

const DesktopSettingsPanel = ({ onClose }: DesktopSettingsPanelProps) => {
    const { createNotification } = useNotifications();

    const openDesktopSettingsTab = async (tab?: 'general' | 'connectors') => {
        try {
            onClose?.();
            await openDesktopSettings(tab);
        } catch {
            createNotification({
                type: 'error',
                text: c('collider_2025: Error').t`Could not open the desktop settings`,
            });
        }
    };

    return (
        <div className="flex flex-column flex-nowrap *:min-size-auto gap-4">
            <SettingsSectionItemButton
                icon="Settings"
                text={c('collider_2025: Title').t`${LUMO_SHORT_APP_NAME} Desktop settings`}
                subtext={c('collider_2025: Description')
                    .t`Configure app preferences, keyboard shortcuts, and updates in the desktop settings window.`}
                button={<IcArrowWithinSquare className="shrink-0 color-hint mr-2" />}
                onClick={() => openDesktopSettingsTab('general')}
                data-testid="desktop-settings-panel:open-general"
            />
            <SettingsSectionItemButton
                icon="Blocks"
                text={c('collider_2025: Title').t`Connectors`}
                subtext={c('collider_2025: Description')
                    .t`Add connectors, manage credentials, and set tool approval policies.`}
                button={<IcArrowWithinSquare className="shrink-0 color-hint mr-2" />}
                onClick={() => openDesktopSettingsTab('connectors')}
                data-testid="desktop-settings-panel:open-connectors"
            />
        </div>
    );
};

export default DesktopSettingsPanel;
