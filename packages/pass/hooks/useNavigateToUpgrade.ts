import { usePassConfig } from '@proton/pass/hooks/usePassConfig';

import { useNavigation } from '../components/Navigation/NavigationProvider';

export const useNavigateToUpgrade = () => {
    const { SSO_URL } = usePassConfig();
    const { onLink } = useNavigation();

    return () => onLink(`${SSO_URL}/pass/upgrade`);
};
