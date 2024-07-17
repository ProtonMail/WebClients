import type { FactoryOpts } from 'imask';
import MaskedRange from 'imask/masked/range';

export const birthdateMask: FactoryOpts = {
    mask: 'DD/MM/YYYY',
    blocks: {
        DD: {
            mask: MaskedRange,
            from: 1,
            to: 31,
        },
        MM: {
            mask: MaskedRange,
            from: 1,
            to: 12,
        },
        YYYY: {
            mask: MaskedRange,
            from: 0,
            to: 9999,
        },
    },
};
