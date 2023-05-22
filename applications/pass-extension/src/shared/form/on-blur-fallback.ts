import type { FocusEvent } from 'react';

import type { FormikContextType } from 'formik';

import { isEmptyString } from '@proton/pass/utils/string';

export const onBlurFallback =
    <T extends FormikContextType<any>, V = T['values'], K extends keyof V = keyof V>(
        form: T,
        name: K,
        fallback: V[K]
    ) =>
    (e: FocusEvent<HTMLInputElement>) =>
        isEmptyString(e.target.value) && form.setFieldValue(name as string, fallback);
