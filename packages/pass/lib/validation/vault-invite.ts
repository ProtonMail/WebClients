import type { MutableRefObject, RefObject } from 'react';

import { type FormikErrors } from 'formik';

import { validateVaultValues } from '@proton/pass/lib/validation/vault';
import type { InviteFormValues } from '@proton/pass/types';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

export enum InviteEmailsError {
    DUPLICATE = 'DUPLICATE' /* duplicate members */,
    EMPTY = 'EMPTY' /* empty members */,
    INVALID_EMAIL = 'INVALID_EMAIL' /* invalid email string */,
    INVALID_ORG = 'INVALID_ORG' /* invalid organization member */,
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
            const emails = values.members.reduce<{
                errors: string[];
                pass: boolean;
                seen: Set<string>;
            }>(
                (acc, { value }) => {
                    if (acc.seen.has(value.email)) {
                        acc.errors.push(InviteEmailsError.DUPLICATE);
                        acc.pass = false;
                    } else if (!validateEmailAddress(value.email)) {
                        acc.pass = false;
                        acc.errors.push(InviteEmailsError.INVALID_EMAIL);
                    } else if (validateAddresses && validationMap.current.get(value.email) === false) {
                        acc.errors.push(InviteEmailsError.INVALID_ORG);
                        acc.pass = false;
                    } else acc.errors.push('');

                    acc.seen.add(value.email);

                    return acc;
                },
                { errors: [], pass: true, seen: new Set() }
            );

            errors.members = emails.errors;

            /** Determine conditions for displaying trailing input
             * value errors: If the field isn't focused, only show
             * an error if the field is empty and there are no other
             * members in the form. Adapt validation accordingly.  */
            const trailingOnly = values.members.length === 0;
            const trailingFocused = emailField.current === document.activeElement;
            const trailingValue = emailField.current?.value?.trim() ?? '';
            const trailingEmpty = trailingValue.length === 0;
            const trailingValid = !trailingEmpty && validateEmailAddress(trailingValue);

            /* If the trailing input is focused, trigger errors if the trailing
             * value is not a valid email address. If it's not focused, flag errors
             * only when the trailing value is invalid and either the field is
             * empty or there are no other members in the form. */
            if (trailingFocused) {
                emails.pass = emails.pass && (trailingOnly ? trailingValid : trailingValid || trailingEmpty);
            } else if (!trailingValid) {
                if (trailingEmpty && trailingOnly) {
                    emails.pass = false;
                    errors.members.push(InviteEmailsError.EMPTY);
                } else if (!trailingEmpty) {
                    emails.pass = false;
                    errors.members.push(InviteEmailsError.INVALID_EMAIL);
                }
            }

            /* If no errors are found, delete any existing error
             * messages related to members. */
            if (emails.pass) delete errors.members;
        }

        return errors;
    };
