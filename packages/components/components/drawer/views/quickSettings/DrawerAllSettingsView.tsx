import { c } from 'ttag';

import ButtonLike from '@proton/atoms/Button/ButtonLike';
import { SettingsLink } from '@proton/components/components';
import { useConfig } from '@proton/components/hooks';

const DrawerAllSettingsView = () => {
    const { APP_NAME } = useConfig();

    return (
        <ButtonLike
            as={SettingsLink}
            path="/"
            app={APP_NAME}
            data-testid="drawer-quick-settings:all-settings-button"
            className="w100"
            color="norm"
            shape="outline"
        >{c('Title').t`All settings`}</ButtonLike>
    );
};

export default DrawerAllSettingsView;
