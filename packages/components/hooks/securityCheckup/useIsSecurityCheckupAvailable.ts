import { useFlag } from '@unleash/proxy-client-react';

import { getIsSSOVPNOnlyAccount } from '@proton/shared/lib/keys';

import useUser from '../useUser';

const useIsSecurityCheckupAvailable = () => {
    const securityCheckupEnabled = useFlag('SecurityCheckup');
    const [user] = useUser();
    const isSSOUser = getIsSSOVPNOnlyAccount(user);

    const isSecurityCheckupAvailable = user.isPrivate && !isSSOUser;

    return securityCheckupEnabled && isSecurityCheckupAvailable;
};

export default useIsSecurityCheckupAvailable;
