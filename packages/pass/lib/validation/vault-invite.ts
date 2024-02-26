import type { RefObject } from 'react';

import { type FormikErrors } from 'formik';

import { validateVaultValues } from '@proton/pass/lib/validation/vault';
import type { InviteFormValues } from '@proton/pass/types';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

export enum InviteEmailsError {
    DUPLICATE = 'DUPLICATE',
    INVALID = 'INVALID',
    EMPTY = 'EMPTY',
    LIMITED = 'LIMITED', // Limited to organization members
}

export const validateShareInviteValues = (emailFieldRef: RefObject<HTMLInputElement>) => (values: InviteFormValues) => {
    if (values.step === 'vault' && values.withVaultCreation) return validateVaultValues(values);

    let errors: FormikErrors<InviteFormValues> = {};

    if (values.step === 'members') {
        const emails = values.members.reduce<{ errors: string[]; pass: boolean; seen: Set<string> }>(
            (acc, { value }) => {
                if (values.orgEmails && values.orgEmails?.indexOf(value.email) === -1) {
                    acc.errors.push(InviteEmailsError.LIMITED);
                    acc.pass = false;
                }
                if (acc.seen.has(value.email)) {
                    acc.errors.push(InviteEmailsError.DUPLICATE);
                    acc.pass = false;
                } else if (!validateEmailAddress(value.email)) {
                    acc.pass = false;
                    acc.errors.push(InviteEmailsError.INVALID);
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
        if (emailFieldRef.current !== document.activeElement) {
            const trailing = emailFieldRef.current?.value?.trim() ?? '';
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
