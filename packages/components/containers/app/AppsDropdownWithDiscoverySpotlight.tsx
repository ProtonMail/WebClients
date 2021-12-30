import { useLayoutEffect, useRef } from 'react';
import { c } from 'ttag';
import { APPS } from '@proton/shared/lib/constants';
import { UserSettings } from '@proton/shared/lib/interfaces';

import { Spotlight, useSpotlightShow } from '../../components';
import { useConfig, useSpotlightOnFeature, useUserSettings } from '../../hooks';
import { FeatureCode } from '../features';
import AppsDropdown from './AppsDropdown';

const AppsDropdownWithDiscoverySpotlight = () => {
    const { APP_NAME } = useConfig();
    const [userSettings] = useUserSettings();

    const initialUserSettings = useRef<UserSettings>();

    const isMail = APP_NAME === APPS.PROTONMAIL;

    const { AppWelcome = {} } = initialUserSettings.current || {};
    const { Calendar = [], Mail = [], Drive = [] } = AppWelcome;

    const initialShow = isMail && !!Mail.length && !!initialUserSettings && !Calendar.length && !Drive.length;

    useLayoutEffect(() => {
        if (!initialUserSettings.current && userSettings) {
            initialUserSettings.current = userSettings;
        }
    }, [userSettings]);

    const {
        show,
        onDisplayed,
        onClose: onCloseSpotlight,
    } = useSpotlightOnFeature(FeatureCode.SpotlightDiscoverProtonServices, initialShow);

    const shouldShowSpotlight = useSpotlightShow(show);

    return (
        <Spotlight
            originalPlacement="bottom-left"
            show={shouldShowSpotlight}
            onDisplayed={onDisplayed}
            type="discover"
            content={
                <>
                    <div className="text-lg text-bold mb0-25">{c('Spotlight').t`Discover all Proton services`}</div>
                    <p className="m0">
                        {c('Spotlight')
                            .t`Securely manage your schedule, files, and online life! Open to discover all Proton services.`}
                    </p>
                </>
            }
        >
            <AppsDropdown onDropdownClick={onCloseSpotlight} />
        </Spotlight>
    );
};

export default AppsDropdownWithDiscoverySpotlight;
