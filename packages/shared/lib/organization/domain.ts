import { ADDRESS_STATUS } from '../constants';
import type { DomainAddress } from '../interfaces/Address';
import type { Domain } from '../interfaces/Domain';
import { DOMAIN_STATE, MX_STATE } from '../interfaces/Domain';

// Active domains is one that's verified or in warning state, but it can be used to create addresses to
export const getIsDomainActive = (domain: Domain) => {
    return (
        (domain.State === DOMAIN_STATE.DOMAIN_STATE_VERIFIED || domain.State === DOMAIN_STATE.DOMAIN_STATE_WARN) &&
        domain.Flags['mail-intent']
    );
};

export const getIsDomainMxScanNeeded = (domain: Domain) => {
    return getIsDomainActive(domain) && domain.MxState !== MX_STATE.MX_STATE_GOOD;
};

export const getHasAddressMissingProtonMX = (addresses: DomainAddress[]) => {
    return addresses.some(({ Status, ProtonMX }) => Status === ADDRESS_STATUS.STATUS_ENABLED && ProtonMX === false);
};
