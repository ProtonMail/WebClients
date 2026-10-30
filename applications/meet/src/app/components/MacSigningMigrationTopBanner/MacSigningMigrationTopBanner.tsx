import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import TopBanner from '@proton/components/containers/topBanners/TopBanner';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import { electronAppVersion, isElectronMeet, isElectronOnMac } from '@proton/shared/lib/helpers/desktop';
import { useFlag } from '@proton/unleash/useFlag';

import { needsMacSigningMigrationUpdate } from './needsMacSigningMigrationUpdate';

const MAC_DMG_URL = 'https://proton.me/download/meet/macos/ProtonMeet-desktop.dmg';
const MAC_KEYCHAIN_PROMPT_KB_URL = 'https://proton.me/support/mail-mac-keychain-password-prompt';

export const MacSigningMigrationTopBanner = () => {
    const isMacSigningMigrationEnabled = useFlag('MeetDesktopMacSigningMigrationBanner');

    if (
        !isMacSigningMigrationEnabled ||
        !needsMacSigningMigrationUpdate({
            isMeetDesktopApp: isElectronMeet,
            isMac: isElectronOnMac,
            version: electronAppVersion,
        })
    ) {
        return null;
    }

    const downloadUpdate = <Href href={MAC_DMG_URL} key="download-update">{c('Action').t`Download now`}</Href>;
    const learnMore = <Href href={MAC_KEYCHAIN_PROMPT_KB_URL} key="learn-more">{c('Link').t`Learn more`}</Href>;

    return (
        <TopBanner className="bg-warning mt-6">
            <span>{c('Info').jt`Please update ${MEET_APP_NAME} to keep using the app. ${downloadUpdate}`}</span>
            <span className="block text-normal">
                {c('Info')
                    .jt`After updating, your Mac may ask for a password. Type the password you use to unlock your Mac, then click Always Allow to stay signed in. ${learnMore}`}
            </span>
        </TopBanner>
    );
};
