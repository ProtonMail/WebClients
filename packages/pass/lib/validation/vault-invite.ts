import type { MutableRefObject, RefObject } from 'react';

import { type FormikErrors } from 'formik';

import { validateVaultValues } from '@proton/pass/lib/validation/vault';
import type { InviteFormValues } from '@proton/pass/types';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

export enum InviteEmailsError {
    DUPLICATE = 'DUPLICATE',
    INVALID = 'INVALID',
    EMPTY = 'EMPTY',
    EXTERNAL = 'EXTERNAL',
}

type ValidateShareInviteOptions = {
    emailField: RefObject<HTMLInputElement>;
    validateAddresses: boolean;
    validationMap: MutableRefObject<Map<string, boolean>>;
};

export const validateShareInviteValues =
    ({ emailField, validateAddresses, validationMap }: ValidateShareInviteOptions) =>
    (values: InviteFormValues) => {
        if (values.step === 'vault' && values.withVaultCreation) return validateVaultValues(values);

        let errors: FormikErrors<InviteFormValues> = {};

        if (values.step === 'members') {
            const emails = values.members.reduce<{ errors: string[]; pass: boolean; seen: Set<string> }>(
                (acc, { value }) => {
                    if (acc.seen.has(value.email)) {
                        acc.errors.push(InviteEmailsError.DUPLICATE);
                        acc.pass = false;
                    } else if (!validateEmailAddress(value.email)) {
                        acc.pass = false;
                        acc.errors.push(InviteEmailsError.INVALID);
                    } else if (validateAddresses && validationMap.current.get(value.email) === false) {
                        acc.errors.push(InviteEmailsError.EXTERNAL);
                        acc.pass = false;
                    } else acc.errors.push('');

                    acc.seen.add(value.email);

                    return acc;
                },
                { errors: [], pass: true, seen: new Set() }
            );

            errors.members = emails.errors;

            /** Validate the trailing input value only when it is not
             * focused : this value lives outside of the formik state
             * values - as such adapt the validation logic accordingly */
            if (emailField.current !== document.activeElement) {
                const trailing = emailField.current?.value?.trim() ?? '';
                const validTrailingEmail = validateEmailAddress(trailing);

                if (emails.errors.length === 0 && !validTrailingEmail) {
                    emails.pass = false;
                    errors.members.push(InviteEmailsError.EMPTY);
                } else if (trailing && !validTrailingEmail) {
                    emails.pass = false;
                    errors.members.push(InviteEmailsError.INVALID);
                }
            }

            if (emails.pass) delete errors.members;
        }

        return errors;
    };
