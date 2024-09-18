import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { useConfig } from '@proton/components/hooks';
import { APPS, CALENDAR_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

const appName = {
    [APPS.PROTONMAIL]: MAIL_APP_NAME,
    [APPS.PROTONCALENDAR]: CALENDAR_APP_NAME,
};

const DrawerDownloadApps = () => {
    const { APP_NAME } = useConfig();

    // Avoid showing the button if not in supported apps, also to make typescript happy
    if (APP_NAME !== APPS.PROTONMAIL && APP_NAME !== APPS.PROTONCALENDAR) {
        return null;
    }

    // We return null here instead of the wrapper to still mark spotlight as seen
    if (isElectronMail) {
        return null;
    }

    return (
        <ButtonLike
            as={SettingsLink}
            path="/get-the-apps"
            app={APP_NAME}
            data-testid="drawer-quick-settings:download-apps-button"
            shape="outline"
            fullWidth
        >{c('Title').t`Get the ${appName[APP_NAME]} apps`}</ButtonLike>
    );
};

export default DrawerDownloadApps;
