import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { useSettingsLink } from '@proton/components/components';
import { useConfig } from '@proton/components/hooks';
import { APPS_CONFIGURATION } from '@proton/shared/lib/constants';

const DrawerAllSettingsView = () => {
    const goToSettings = useSettingsLink();
    const { APP_NAME } = useConfig();

    const path = APPS_CONFIGURATION[APP_NAME].publicPath;

    return (
        <Button
            onClick={() => goToSettings(path, APP_NAME, false)}
            data-testid="drawer-quick-settings:all-settings-button"
            className="w100"
        >{c('Title').t`All settings`}</Button>
    );
};

export default DrawerAllSettingsView;
