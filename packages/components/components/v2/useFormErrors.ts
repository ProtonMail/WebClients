import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { errorClassName } from '../v2/field/InputField';

export type FormFieldValidator = (validations: string[]) => string;

const useFormErrors = () => {
    const [, rerender] = useState<any>();
    const errorsMapRef = useRef<string[]>([]);
    const isSubmittedRef = useRef(false);

    const errors: string[] = [];

    useEffect(() => {
        errorsMapRef.current = errors;
    });

    useEffect(() => {
        return () => {
            errorsMapRef.current = [];
        };
    }, []);

    return {
        reset: () => {
            isSubmittedRef.current = false;
            errorsMapRef.current = [];
            rerender({});
        },
        /**
         * Synchronously rerenders the form, causing re-evaluation of validators.
         * Returns `true` if the form is valid.
         */
        onFormSubmit: (element?: HTMLElement) => {
            isSubmittedRef.current = true;
            if (element) {
                flushSync(() => {
                    rerender({});
                });
                element?.querySelector(`.${errorClassName}`)?.scrollIntoView();
            } else {
                rerender({});
            }
            const oldErrors = errorsMapRef.current;
            return !oldErrors.some((value) => !!value);
        },
        validator: ((validations: string[]) => {
            const error = validations.reduce((acc, x) => acc || x, '');
            errors.push(error);
            return isSubmittedRef.current ? error : '';
        }) satisfies FormFieldValidator,
    };
};

export type FormErrorsHook = ReturnType<typeof useFormErrors>;

export default useFormErrors;
