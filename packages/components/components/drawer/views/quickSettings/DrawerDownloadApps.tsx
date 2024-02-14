import { c } from 'ttag';

import ButtonLike from '@proton/atoms/Button/ButtonLike';
import { SettingsLink } from '@proton/components/components';
import { useDesktopSpotlight } from '@proton/components/containers';
import InboxDestktopSpotlight from '@proton/components/containers/desktop/InboxDesktopSpotlight';
import { useConfig } from '@proton/components/hooks';
import { APPS, CALENDAR_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

const appName = {
    [APPS.PROTONMAIL]: MAIL_APP_NAME,
    [APPS.PROTONCALENDAR]: CALENDAR_APP_NAME,
};

const DrawerDownloadApps = () => {
    const { APP_NAME } = useConfig();
    const { show, onDisplayed, onClose } = useDesktopSpotlight();

    // Avoid showing the button if not in supported apps, also to make typescript happy
    if (APP_NAME !== APPS.PROTONMAIL && APP_NAME !== APPS.PROTONCALENDAR) {
        return null;
    }

    return (
        <InboxDestktopSpotlight show={show} onDisplayed={onDisplayed} onClose={onClose}>
            <ButtonLike
                as={SettingsLink}
                path="/protonmail-for-desktop"
                app={APP_NAME}
                data-testid="drawer-quick-settings:download-apps-button"
                shape="outline"
                fullWidth
            >{c('Title').t`Get the ${appName[APP_NAME]} apps`}</ButtonLike>
        </InboxDestktopSpotlight>
    );
};

export default DrawerDownloadApps;
