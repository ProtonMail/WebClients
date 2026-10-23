import { useConfig } from '@proton/app-context/useConfig';
import { APPS } from '@proton/shared/lib/constants';
import { MailFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';

import useLumoInMailPreference from './useLumoInMailPreference';

/**
 * Whether the Lumo assistant drawer is available: only in the Mail app, only behind the `LumoInMail`
 * flag, and only while the user has not turned Lumo off with the quick-settings off-switch. The single
 * gate consumed by the drawer button, the view switch, and the provider mount.
 */
const useLumoInMail = () => {
    const { APP_NAME } = useConfig();
    const isEnabled = useFlag(MailFeatureFlag.LumoInMail);
    const [isPreferred] = useLumoInMailPreference();

    return isEnabled && APP_NAME === APPS.PROTONMAIL && isPreferred;
};

export default useLumoInMail;
