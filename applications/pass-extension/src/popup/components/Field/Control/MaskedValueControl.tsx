import { type VFC } from 'react';

import { type FactoryArg } from 'imask/esm/masked/factory';
import { pipe } from 'imask/esm/masked/pipe';

import { ValueControl, type ValueControlProps } from './ValueControl';

export type MaskedValueControlProps = ValueControlProps & {
    mask: FactoryArg;
};

export const MaskedValueControl: VFC<MaskedValueControlProps> = ({ mask, ...props }) => {
    const { value } = props;
    const maskedValue = value ? pipe(value, mask) : '';

    return <ValueControl {...props} hiddenValue={maskedValue.replace(/[^\s]/g, '•')} value={maskedValue} />;
};
