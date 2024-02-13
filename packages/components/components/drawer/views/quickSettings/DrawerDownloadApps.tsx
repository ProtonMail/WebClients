import { c } from 'ttag';

import ButtonLike from '@proton/atoms/Button/ButtonLike';
import { SettingsLink } from '@proton/components/components';
import { useConfig } from '@proton/components/hooks';
import { APPS, CALENDAR_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

const appName = {
    [APPS.PROTONMAIL]: MAIL_APP_NAME,
    [APPS.PROTONCALENDAR]: CALENDAR_APP_NAME,
};

const DrawerDownloadApps = () => {
    const { APP_NAME } = useConfig();
    if (APP_NAME !== APPS.PROTONMAIL && APP_NAME !== APPS.PROTONCALENDAR) {
        return null;
    }

    return (
        <ButtonLike
            as={SettingsLink}
            path="/protonmail-for-desktop"
            app={APP_NAME}
            data-testid="drawer-quick-settings:download-apps-button"
            className="w-full"
            shape="outline"
        >{c('Title').t`Get the ${appName[APP_NAME]} apps`}</ButtonLike>
    );
};

export default DrawerDownloadApps;
