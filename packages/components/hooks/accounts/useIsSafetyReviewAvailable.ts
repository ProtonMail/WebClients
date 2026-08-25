import { useUser } from '@proton/account/user/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { APPS } from '@proton/shared/lib/constants';
import { getIsSSOVPNOnlyAccount } from '@proton/shared/lib/keys';

const useIsSafetyReviewAvailable = () => {
    const [user] = useUser();
    const isSSOUser = getIsSSOVPNOnlyAccount(user);
    const { APP_NAME } = useConfig();

    const isSecurityCheckupAvailable = user.isPrivate && !isSSOUser;

    return APP_NAME !== APPS.PROTONVPN_SETTINGS && isSecurityCheckupAvailable;
};

export default useIsSafetyReviewAvailable;
