import { APPS } from '@proton/shared/lib/constants';
import { MailFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';

import useConfig from '../../../../hooks/useConfig';

/**
 * Whether the Lumo assistant drawer is available: only in the Mail app, and only behind the `LumoInMail`
 * flag. The single gate consumed by the drawer button, the view switch, and the provider mount.
 */
const useLumoInMail = () => {
    const { APP_NAME } = useConfig();
    const isEnabled = useFlag(MailFeatureFlag.LumoInMail);

    return isEnabled && APP_NAME === APPS.PROTONMAIL;
};

export default useLumoInMail;
