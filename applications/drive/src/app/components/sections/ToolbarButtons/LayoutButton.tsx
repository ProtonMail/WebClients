import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { useUserSettings } from '../../../store';

const LayoutButton = () => {
    const { layout, changeLayout } = useUserSettings();

    return (
        <ToolbarButton
            onClick={() => changeLayout(layout === LayoutSetting.Grid ? LayoutSetting.List : LayoutSetting.Grid)}
            icon={<Icon name={layout === LayoutSetting.Grid ? 'list' : 'grid'} />}
            data-testid="toolbar-layout"
            title={c('Title').t`Change layout`}
        />
    );
};

export default LayoutButton;
