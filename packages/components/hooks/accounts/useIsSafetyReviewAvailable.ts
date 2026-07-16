import { useUser } from '@proton/account/user/hooks';
import { APPS } from '@proton/shared/lib/constants';
import { getIsSSOVPNOnlyAccount } from '@proton/shared/lib/keys';

import useConfig from '../useConfig';

const useIsSafetyReviewAvailable = () => {
    const [user] = useUser();
    const isSSOUser = getIsSSOVPNOnlyAccount(user);
    const { APP_NAME } = useConfig();

    const isSecurityCheckupAvailable = user.isPrivate && !isSSOUser;

    return APP_NAME !== APPS.PROTONVPN_SETTINGS && isSecurityCheckupAvailable;
};

export default useIsSafetyReviewAvailable;
