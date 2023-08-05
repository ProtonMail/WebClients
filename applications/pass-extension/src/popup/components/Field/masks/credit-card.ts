import type { FactoryOpts } from 'imask';
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

export const cardNumberHiddenValue = (value: string): string => {
    if (!value.length) {
        return '';
    }
    if (value.length < 12) {
        return '•••• •••• •••• ••••';
    }

    const firstFour = value.slice(0, 4);
    const lastFour = value.slice(-4);

    switch (Number(value.slice(0, 2))) {
        case 34:
        case 37:
            return `${firstFour} •••••• •${lastFour}`;
        default:
            return `${firstFour} •••• •••• ${lastFour}`;
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
            from: 1900,
            to: 2100,
        },
    },
} as FactoryOpts;
