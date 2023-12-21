import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';

export const useNavigateToUpgrade = (path?: string) => {
    const { onLink, config } = usePassCore();
    return () => onLink(path ? `${config.SSO_URL}/${path}` : `${config.SSO_URL}/pass/upgrade`);
};
