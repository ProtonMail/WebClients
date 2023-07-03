import { type FactoryOpts } from 'imask/esm';
import MaskedRange from 'imask/esm/masked/range';

export const cardNumberMask = (value: string): FactoryOpts => {
    switch (Number(value.slice(0, 2))) {
        /* AMEX */
        case 34:
        case 37:
            return { mask: '0000 000000 00000' };
        default:
            return { mask: '0000 0000 0000 0000 000' };
    }
};

export const expDateMask = {
    mask: 'MM/YYYY',
    blocks: {
        MM: {
            mask: MaskedRange,
            from: 1,
            to: 12,
        },
        YYYY: {
            mask: MaskedRange,
            from: 1000,
            to: 2999,
        },
    },
} as FactoryOpts;
