import useConfig from '@proton/components/hooks/useConfig';

/**
 * Is security center enabled
 * @returns {boolean} isSecurityCenterEnabled
 */
const useSecurityCenter = () => {
    const { APP_NAME } = useConfig();

    return APP_NAME === 'proton-mail';
};

export default useSecurityCenter;
