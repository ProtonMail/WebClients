export const MAX_EPOCH_INTERVAL = 24 * 60 * 60 * 1000;
export const EXP_EPOCH_INTERVAL = 4 * 60 * 60 * 1000;

export enum KT_STATUS {
    KT_FAILED,
    KT_PASSED,
    KT_WARNING,
    KTERROR_ADDRESS_NOT_IN_KT,
    KTERROR_MINEPOCHID_NULL,
}

export const vrfHexKey = '2d7688feb429f714f102f758412cd4b81337b307122770f620ad9e4ac898a2eb';

export class KTError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'KTError';
    }
}
