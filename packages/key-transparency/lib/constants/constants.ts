import { HOUR } from '@proton/shared/lib/constants';

export const MAX_EPOCH_INTERVAL = 72 * HOUR;
export const EXPECTED_EPOCH_INTERVAL = 4 * HOUR;

// VRF constants
export const vrfHexKeyDev = '2d7688feb429f714f102f758412cd4b81337b307122770f620ad9e4ac898a2eb';
export const vrfHexKeyProd = '90a74b3d3ad9cb92e62c4e9c32acc3cc3eff199a32a0ab47a05872c2f15a99c6';
export const N = 16;
export const ptLen = 2 * N; // = qLen
export const CO_FACTOR = 8;
export const LEFT_N = 1; // left neighbour
export const KT_LEN = 32;

export const epochChainVersion = 1;

export enum KT_DOMAINS {
    PROD = 'keytransparency.ch',
    ATLAS_DEV = 'dev.proton.wtf',
    DEV_POSTFIX = '.proton.wtf',
    UNKNOWN = 'unknown',
}

export enum KT_CERTIFICATE_ISSUER {
    LETSENCRYPT,
    ZEROSSL,
}

// Number of independent CT operators from which
// we expect SCTs on epoch certificates
export const SCT_THRESHOLD = 1;

export const KT_VE_SIGNING_CONTEXT = {
    value: `key-transparency.verified-epoch.${epochChainVersion}`,
    critical: true,
};

export const KT_VE_VERIFICATION_CONTEXT = {
    value: `key-transparency.verified-epoch.${epochChainVersion}`,
    required: true,
};

export const KT_SKL_SIGNING_CONTEXT = {
    value: 'key-transparency.key-list',
    critical: false,
};

export const KT_SKL_VERIFICATION_CONTEXT = {
    value: 'key-transparency.key-list',
    required: false,
};
