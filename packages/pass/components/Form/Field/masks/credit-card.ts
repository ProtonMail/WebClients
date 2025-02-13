import type { FactoryOpts } from 'imask';
import MaskedRange from 'imask/esm/masked/range';

/** If mask is triggered on masked value : accept any character rather
 * than only digits as partial deobfuscation will include `*` chars.
 * - mask='0': only digits allowed
 * - mask='*': any char allowed */
export const cardNumberMask = (value: string, hidden: boolean = false): FactoryOpts => {
    switch (Number(value.slice(0, 2))) {
        /* AMEX */
        case 34:
        case 37:
            return { mask: hidden ? '**** ****** *****' : '0000 000000 00000' };
        default:
            return { mask: hidden ? '**** **** **** **** ***' : '0000 0000 0000 0000 000' };
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
    mask: 'MM/YY',
    blocks: {
        MM: {
            mask: MaskedRange,
            from: 1,
            to: 12,
        },
        YY: {
            mask: MaskedRange,
            from: 0,
            to: 99,
        },
    },
} as FactoryOpts;
