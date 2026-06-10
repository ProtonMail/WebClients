import useConfig from '@proton/components/hooks/useConfig';
import { APPS } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { useFlag } from '@proton/unleash/useFlag';

export const useCanEnableChat = (user: UserModel) => {
    const { APP_NAME } = useConfig();
    const isZendeskAIAgentEnabled = useFlag('EnableZenDeskAIAgent');

    if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
        return isZendeskAIAgentEnabled || user.hasPaidVpn;
    }
    return false;
};
