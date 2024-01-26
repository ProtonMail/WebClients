import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import type { AccountPath } from '@proton/pass/constants';

import { authStore } from '../lib/auth/store';

export const useNavigateToAccount = (path: AccountPath) => {
    const { onLink, config } = usePassCore();

    const localID = authStore?.getLocalID();
    const localIdPath = localID !== undefined ? `u/${localID}/` : '';

    const href = `${config.SSO_URL}/${localIdPath}${path}`;

    return () => onLink(href);
};
