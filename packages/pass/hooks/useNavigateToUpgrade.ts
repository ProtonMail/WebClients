import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';

export const useNavigateToUpgrade = () => {
    const { onLink, config } = usePassCore();
    return () => onLink(`${config.SSO_URL}/pass/upgrade`);
};
