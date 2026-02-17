import useConfig from '@proton/components/hooks/useConfig';
import { APPS } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

export const useCanEnableChat = (user: UserModel) => {
    const canEnableChat = user.hasPaidVpn;
    const { APP_NAME } = useConfig();

    return APP_NAME === APPS.PROTONVPN_SETTINGS && canEnableChat;
};
