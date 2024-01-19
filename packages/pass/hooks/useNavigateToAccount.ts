import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';

import { PASS_ACCOUNT_PATH } from '../constants';
import { authStore } from '../lib/auth/store';

export const useNavigateToAccount = () => {
    const { onLink, config } = usePassCore();

    const localID = authStore?.getLocalID();
    const localIdPath = localID !== undefined ? `u/${localID}/` : '';

    const href = `${config.SSO_URL}/${localIdPath}${PASS_ACCOUNT_PATH}`;

    return () => onLink(href);
};
