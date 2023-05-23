import type { FormikErrors } from 'formik';
import { c } from 'ttag';

import { parseOTPValue } from '@proton/pass/utils/otp/otp';
import { isEmptyString } from '@proton/pass/utils/string';

import type { ExtraFieldFormValue, ExtraFieldGroupValues } from './ExtraFieldGroup';

export const validateExtraFields = <T extends ExtraFieldGroupValues>(values: T) =>
    ({
        extraFields: values.extraFields.map((field) => {
            const fieldErrors: FormikErrors<ExtraFieldFormValue> = {};

            if (isEmptyString(field.fieldName)) fieldErrors.fieldName = c('Validation').t`field name cannot be empty`;
            switch (field.type) {
                case 'hidden':
                case 'text':
                    /* some validation maybe ? */
                    break;
                case 'totp':
                    const normalized = parseOTPValue(field.value);
                    if (!normalized) {
                        fieldErrors.value = c('Validation').t`OTP Secret or URI is invalid`;
                        break;
                    }
            }

            return fieldErrors;
        }),
    } as FormikErrors<T>);
