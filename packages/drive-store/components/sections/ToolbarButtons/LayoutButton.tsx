import { c } from 'ttag';

import { Icon, ToolbarButton, useNotifications } from '@proton/components';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { useUserSettings } from '../../../store';

const LayoutButton = () => {
    const { createNotification } = useNotifications();
    const { layout, changeLayout } = useUserSettings();

    const handleClick = (e: any) => {
        void changeLayout(layout === LayoutSetting.Grid ? LayoutSetting.List : LayoutSetting.Grid);

        // Show notification after ten clicks.
        if (e.detail === 10) {
            createNotification({
                type: 'info',
                text: 'To list, or not to grid',
            });
        }
    };

    return (
        <ToolbarButton
            onClick={handleClick}
            icon={
                <Icon
                    name={layout === LayoutSetting.Grid ? 'list-bullets' : 'grid-3'}
                    alt={layout === LayoutSetting.Grid ? c('Action').t`Grid layout` : 'List layout'}
                />
            }
            data-testid="toolbar-layout"
            title={c('Title').t`Change layout`}
        />
    );
};

export default LayoutButton;
