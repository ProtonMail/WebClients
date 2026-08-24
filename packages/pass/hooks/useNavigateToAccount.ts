import { useAuthStore } from '../components/Core/AuthStoreProvider';
import { usePassCore } from '../components/Core/PassCoreProvider';
import type { AccountPath } from '../constants';

export const useNavigateToAccount = (path: AccountPath) => {
    const { onLink, config } = usePassCore();
    const authStore = useAuthStore();

    const localID = authStore?.getLocalID();
    const localIdPath = localID !== undefined ? `u/${localID}/` : '';

    const href = `${config.SSO_URL}/${localIdPath}${path}`;

    return () => onLink(href);
};
