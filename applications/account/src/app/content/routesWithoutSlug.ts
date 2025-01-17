import { SECURITY_CHECKUP_PATHS, SETUP_ADDRESS_PATH } from '@proton/shared/lib/constants';

export const getRoutesWithoutSlug = () => {
    return {
        setup: SETUP_ADDRESS_PATH,
        legacySecurityCheckup: '/security-checkup',
        securityCheckup: SECURITY_CHECKUP_PATHS.ROOT,
        porkbunClaim: '/partner/porkbun/claim',
    };
};
