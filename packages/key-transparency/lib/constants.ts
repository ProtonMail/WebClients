import { HOUR } from '@proton/shared/lib/constants';

export const MAX_EPOCH_INTERVAL = 24 * HOUR;
export const EXP_EPOCH_INTERVAL = 4 * HOUR;

export enum KT_STATUS {
    KT_FAILED,
    KT_PASSED,
    KT_WARNING,
    KTERROR_ADDRESS_NOT_IN_KT,
    KTERROR_MINEPOCHID_NULL,
}

// VRF constants
export const vrfHexKey = '2d7688feb429f714f102f758412cd4b81337b307122770f620ad9e4ac898a2eb';
export const N = 16;
export const ptLen = 2 * N; // = qLen
export const CO_FACTOR = 8;
export const LEFT_N = 1; // left neighbour
export const KT_LEN = 32;
