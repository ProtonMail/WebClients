import { useEffect, useRef, useState } from 'react';

import type { FieldProps } from 'formik';
import type { InputMask, InputMaskElement } from 'imask';
import IMask from 'imask/esm/imask';
import type { FactoryOpts } from 'imask/masked/factory';

import type { MaybeNull } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export const useFieldMask = <Opts extends FactoryOpts>({ form, field }: FieldProps, options: Opts) => {
    const { value, name } = field;
    const [maskedValue, setMaskedValue] = useState<string>('');
    const maskRef = useRef<MaybeNull<InputMask<Opts>>>();
    const inputRef = useRef<InputMaskElement>();

    useEffect(() => {
        if (inputRef.current) {
            maskRef.current = maskRef.current ?? IMask<Opts>(inputRef.current, options);
            maskRef.current.updateOptions(options as any);
        }
    }, [options]);

    useEffect(() => {
        if (maskRef.current) {
            maskRef.current.on('accept', () => {
                setMaskedValue(maskRef.current!.value);
                form.setFieldValue(name, maskRef.current!.unmaskedValue).catch(noop);
            });
        }
    }, []);

    useEffect(() => {
        /* if the current unmasked value doesn't match our field's value
         * then we have programatically set the field's value. In this case
         * we need to reconciliate imask with the new values */
        if (maskRef.current && value !== maskRef.current?.unmaskedValue) {
            maskRef.current.typedValue = value;
            maskRef.current.unmaskedValue = value;
            maskRef.current.updateValue();
            setMaskedValue(maskRef.current.value);
        }
    }, [value]);

    useEffect(() => () => maskRef.current?.destroy(), []);

    return { inputRef, maskedValue };
};
