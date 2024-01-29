import { useFlag } from '@proton/components/containers';

/**
 * Is security center enabled
 * @returns {boolean} isSecurityCenterEnabled
 */
const useSecurityCenter = () => {
    const isSecurityCenterEnabled = useFlag('DrawerSecurityCenter');

    return isSecurityCenterEnabled;
};

export default useSecurityCenter;
