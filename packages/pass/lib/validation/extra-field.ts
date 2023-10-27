import type { FormikErrors } from 'formik';
import isEmpty from 'lodash/isEmpty';
import { c } from 'ttag';

import { parseOTPValue } from '@proton/pass/lib/otp/otp';
import type { ExtraFieldGroupValues, UnsafeItemExtraField } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

export const validateExtraFields = <T extends ExtraFieldGroupValues>(values: T) => {
    const errors = values.extraFields.map((field) => {
        const fieldErrors: FormikErrors<UnsafeItemExtraField> = {};

        if (isEmptyString(field.fieldName)) fieldErrors.fieldName = c('Validation').t`Field name is required`;

        switch (field.type) {
            case 'totp':
                const isTotpEmpty = isEmptyString(field.data.totpUri);

                if (isTotpEmpty) {
                    fieldErrors.data = { totpUri: c('Validation').t`OTP secret or URI required` };
                    break;
                }

                if (!isTotpEmpty && !parseOTPValue(field.data.totpUri)) {
                    fieldErrors.data = { totpUri: c('Validation').t`OTP secret or URI is invalid` };
                    break;
                }
        }

        return fieldErrors;
    });

    return Boolean(errors.some((fieldErrors) => !isEmpty(fieldErrors)))
        ? ({ extraFields: errors } as FormikErrors<T>)
        : undefined;
};
