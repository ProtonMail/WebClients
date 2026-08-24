import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';

import useConfig from '../../../../hooks/useConfig';
import SettingsLink from '../../../link/SettingsLink';

const DrawerAllSettingsView = () => {
    const { APP_NAME } = useConfig();

    return (
        <ButtonLike
            as={SettingsLink}
            path="/"
            app={APP_NAME}
            data-testid="drawer-quick-settings:all-settings-button"
            className="w-full"
            color="norm"
        >{c('Title').t`All settings`}</ButtonLike>
    );
};

export default DrawerAllSettingsView;
