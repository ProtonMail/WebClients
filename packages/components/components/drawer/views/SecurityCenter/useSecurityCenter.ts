import useFlag from '@proton/components/containers/unleash/useFlag';
import useConfig from '@proton/components/hooks/useConfig';

/**
 * Is security center enabled
 * @returns {boolean} isSecurityCenterEnabled
 */
const useSecurityCenter = () => {
    const isSecurityCenterEnabled = useFlag('DrawerSecurityCenter');
    const { APP_NAME } = useConfig();

    return isSecurityCenterEnabled && APP_NAME === 'proton-mail';
};

export default useSecurityCenter;
