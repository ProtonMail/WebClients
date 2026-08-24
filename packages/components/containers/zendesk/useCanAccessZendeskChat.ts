import { useState } from 'react';

import { APPS } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { useFlag } from '@proton/unleash/useFlag';

import useConfig from '../../hooks/useConfig';

export const useCanAccessZendeskChat = (user: UserModel) => {
    const { APP_NAME } = useConfig();
    const [isZendeskAIAgentEnabled] = useState(useFlag('EnableZenDeskAIAgent'));

    if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
        return isZendeskAIAgentEnabled || user.hasPaidVpn;
    } else if (APP_NAME === APPS.PROTONACCOUNT) {
        return isZendeskAIAgentEnabled;
    }
    return false;
};
