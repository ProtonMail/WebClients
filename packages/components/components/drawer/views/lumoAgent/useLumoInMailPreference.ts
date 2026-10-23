import { useUser } from '@proton/account/user/hooks';

import { useLocalStateSync } from '../../../../hooks/useLocalStateSync';

const LUMO_IN_MAIL_ENABLED_KEY = 'lumo-in-mail-enabled';

const useLumoInMailPreference = (): [enabled: boolean, setEnabled: (enabled: boolean) => void] => {
    const [user] = useUser();

    return useLocalStateSync<boolean>(true, `${LUMO_IN_MAIL_ENABLED_KEY}-${user.ID}`);
};

export default useLumoInMailPreference;
