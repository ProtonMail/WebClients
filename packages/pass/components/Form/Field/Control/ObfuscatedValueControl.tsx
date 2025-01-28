import { type ElementType, useState } from 'react';

import { type FactoryArg } from 'imask/esm/masked/factory';
import { pipe } from 'imask/esm/masked/pipe';

import type { ObfuscatedItemProperty } from '@proton/pass/types/data/obfuscation';

import { ValueControl, type ValueControlProps } from './ValueControl';

export type ObfuscatedValueControlProps<E extends ElementType> = Omit<
    ValueControlProps<E>,
    'value' | 'clipboardValue' | 'hiddenValue'
> & {
    value: ObfuscatedItemProperty;
    deobfuscate: (value: ObfuscatedItemProperty, hidden: boolean) => string;
    hiddenValue?: string | ((deobfuscation: string) => string);
    mask?: (deobfuscation: string) => FactoryArg;
};

export const ObfuscatedValueControl = <E extends ElementType>({
    value,
    deobfuscate,
    hiddenValue,
    mask,
    ...props
}: ObfuscatedValueControlProps<E>) => {
    const [deobfuscation, setDeobfuscation] = useState(deobfuscate(value, false));
    const maskedValue = deobfuscation && mask ? pipe(deobfuscation, mask?.(deobfuscation)) : '';

    const onHide = (hidden: boolean) => setDeobfuscation(deobfuscate(value, hidden));
    const clipboardValue = props.clickToCopy ? () => deobfuscate(value, false) : undefined;

    return (
        <ValueControl
            {...props}
            clipboardValue={clipboardValue}
            hiddenValue={hiddenValue instanceof Function ? hiddenValue(deobfuscation) : hiddenValue}
            onHide={onHide}
            value={maskedValue}
        />
    );
};
