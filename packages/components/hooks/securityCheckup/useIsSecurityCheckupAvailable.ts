import { useFlag } from '@unleash/proxy-client-react';

import { useUser } from '@proton/account/user/hooks';
import { APPS } from '@proton/shared/lib/constants';
import { getIsSSOVPNOnlyAccount } from '@proton/shared/lib/keys';

import useConfig from '../useConfig';

const useIsSecurityCheckupAvailable = () => {
    const securityCheckupEnabled = useFlag('SecurityCheckup');
    const [user] = useUser();
    const isSSOUser = getIsSSOVPNOnlyAccount(user);
    const { APP_NAME } = useConfig();

    const isSecurityCheckupAvailable = user.isPrivate && !isSSOUser;

    return APP_NAME !== APPS.PROTONVPN_SETTINGS && securityCheckupEnabled && isSecurityCheckupAvailable;
};

export default useIsSecurityCheckupAvailable;
