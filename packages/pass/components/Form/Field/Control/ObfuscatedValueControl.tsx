import { type ElementType, useState } from 'react';

import type { FactoryArg } from 'imask/esm/masked/factory';
import { pipe } from 'imask/esm/masked/pipe';

import type { ObfuscatedItemProperty } from '@proton/pass/types/data/obfuscation';

import { ValueControl, type ValueControlProps } from './ValueControl';

export type ObfuscatedValueControlProps<E extends ElementType> = Omit<
    ValueControlProps<E>,
    'value' | 'clipboardValue' | 'hiddenValue'
> & {
    hiddenValue?: string | ((deobfuscation: string) => string);
    value: ObfuscatedItemProperty;
    /** Use the `hidden` property to apply partial deobfuscation
     * when necessary. This can be useful to avoid fully deobfuscating
     * the field if the field is masked in the UI */
    deobfuscate: (value: ObfuscatedItemProperty, hidden: boolean) => string;
    /** Receives the partial or full deobfuscated value depending on
     * the `hidden` state of the underlying `ValueControl` */
    mask?: (value: string, hidden: boolean) => FactoryArg;
};

export const ObfuscatedValueControl = <E extends ElementType>({
    value,
    deobfuscate,
    hiddenValue,
    mask,
    ...props
}: ObfuscatedValueControlProps<E>) => {
    /** Field will be masked on mount, trigger `hidden` deobfuscation by default */
    const [deobfuscation, setDeobfuscation] = useState(deobfuscate(value, true));
    const maskedValue = mask ? pipe(deobfuscation, mask(deobfuscation, true)) : deobfuscation;

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
