import type { Domain } from '../interfaces';
import { DOMAIN_STATE } from '../interfaces';

// Active domains is one that's verified or in warning state, but it can be used to create addresses to
export const getIsDomainActive = (domain: Domain) => {
    return (
        (domain.State === DOMAIN_STATE.DOMAIN_STATE_VERIFIED || domain.State === DOMAIN_STATE.DOMAIN_STATE_WARN) &&
        domain.Flags['mail-intent']
    );
};
