import type { FormEvent } from 'react';
import { useState } from 'react';

import type { Maybe, MaybePromise } from '@proton/pass/types';
import type { TypedFormElement } from '@proton/pass/types/utils/dom';
import { type XorObfuscation, obfuscate } from '@proton/pass/utils/obfuscate/xor';

/** Manages form state for password inputs with a focus on minimizing the
 * lifetime of plain-text password values in memory:
 * - The password is never stored in React state. The input is uncontrolled.
 * - On each keystroke, the plain-text string is passed transiently through
 * `onValue` for validation, then immediately eligible for GC.
 * - On submit, the plain-text is read once from the DOM & obfuscated.
 * - After submission the form state is wiped. */
type FormState = { touched: boolean; error?: string };

type UsePasswordFormOptions = {
    onSubmit: (password: XorObfuscation) => MaybePromise<void>;
    onValidate?: (password: string) => Maybe<string>;
};

export const usePasswordForm = ({ onSubmit, onValidate }: UsePasswordFormOptions) => {
    const [state, setState] = useState<FormState>({ touched: false });

    const onValue = (password: string) => setState({ touched: true, error: onValidate?.(password) });

    const onFormSubmit = async (evt: FormEvent<HTMLFormElement>) => {
        evt.preventDefault();
        if (state.error) return;
        const form = evt.currentTarget as TypedFormElement<'password'>;
        await onSubmit(obfuscate(form.elements.password.value));
        form.reset();
        setState({ touched: false });
    };

    return { state, onValue, onFormSubmit };
};
