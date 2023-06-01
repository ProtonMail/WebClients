import type { FormikErrors } from 'formik';
import isEmpty from 'lodash/isEmpty';
import { c } from 'ttag';

import type { ItemExtraField } from '@proton/pass/types';
import { parseOTPValue } from '@proton/pass/utils/otp/otp';
import { isEmptyString } from '@proton/pass/utils/string';

import type { ExtraFieldGroupValues } from './ExtraFieldGroup';

export const validateExtraFields = <T extends ExtraFieldGroupValues>(values: T) => {
    const errors = values.extraFields.map((field) => {
        const fieldErrors: FormikErrors<ItemExtraField> = {};

        if (isEmptyString(field.fieldName)) fieldErrors.fieldName = c('Validation').t`Label is required`;

        switch (field.type) {
            case 'totp':
                const isTotpEmpty = isEmptyString(field.data.totpUri);

                if (isTotpEmpty) {
                    fieldErrors.data = { totpUri: c('Validation').t`OTP Secret or URI required` };
                    break;
                }

                if (!isTotpEmpty && !parseOTPValue(field.data.totpUri)) {
                    fieldErrors.data = { totpUri: c('Validation').t`OTP Secret or URI is invalid` };
                    break;
                }
        }

        return fieldErrors;
    });

    return Boolean(errors.some((fieldErrors) => !isEmpty(fieldErrors)))
        ? ({ extraFields: errors } as FormikErrors<T>)
        : undefined;
};
