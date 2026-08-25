import { useConfig } from '@proton/app-context/useConfig';

/**
 * Is security center enabled
 * @returns {boolean} isSecurityCenterEnabled
 */
const useSecurityCenter = () => {
    const { APP_NAME } = useConfig();

    return APP_NAME === 'proton-mail';
};

export default useSecurityCenter;
