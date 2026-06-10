import { c } from 'ttag';

import { ToolbarButton, useNotifications } from '@proton/components';
import { IcGrid3 } from '@proton/icons/icons/IcGrid3';
import { IcListBullets } from '@proton/icons/icons/IcListBullets';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { useUserSettings } from '../../../../modules/userSettings';

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
                layout === LayoutSetting.Grid ? (
                    <IcListBullets alt={c('Action').t`Grid layout`} />
                ) : (
                    <IcGrid3 alt={c('Action').t`List layout`} />
                )
            }
            data-testid="toolbar-layout"
            title={c('Title').t`Change layout`}
        />
    );
};

export default LayoutButton;
