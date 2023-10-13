import type { ElementType } from 'react';

import { type FactoryArg } from 'imask/esm/masked/factory';
import { pipe } from 'imask/esm/masked/pipe';

import { ValueControl, type ValueControlProps } from './ValueControl';

export type MaskedValueControlProps<E extends ElementType> = ValueControlProps<E> & {
    mask: FactoryArg;
};

export const MaskedValueControl = <E extends ElementType>({ mask, ...props }: MaskedValueControlProps<E>) => {
    const { value } = props;
    const maskedValue = value ? pipe(value, mask) : '';

    return <ValueControl {...props} value={maskedValue} />;
};
