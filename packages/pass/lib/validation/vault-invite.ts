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

            /** Show any trailing input value error only when the field
             * is not focused : this value lives outside of the formik state
             * values - as such adapt the validation logic accordingly */
            const showError = emailField.current !== document.activeElement;
            const empty = emails.errors.length === 0;
            const trailing = emailField.current?.value?.trim() ?? '';
            const validTrailingEmail = validateEmailAddress(trailing);

            if (!validTrailingEmail) {
                emails.pass = false;
                if (showError && empty) errors.members.push(InviteEmailsError.EMPTY);
                else if (showError && trailing) errors.members.push(InviteEmailsError.INVALID_EMAIL);
            }

            if (emails.pass) delete errors.members;
        }

        return errors;
    };
