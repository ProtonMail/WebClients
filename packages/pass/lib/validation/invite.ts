import type { MutableRefObject, RefObject } from 'react';

import { type FormikErrors } from 'formik';
import type { Store } from 'redux';

import { AccessTarget } from '@proton/pass/lib/access/types';
import PassUI from '@proton/pass/lib/core/ui.proxy';
import { selectAccessMembers, selectShare } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { InviteFormValues, Maybe } from '@proton/pass/types';

export enum InviteEmailsError {
    DUPLICATE = 'DUPLICATE' /* duplicate members */,
    EMPTY = 'EMPTY' /* empty members */,
    INVALID_EMAIL = 'INVALID_EMAIL' /* invalid email string */,
    INVALID_ORG = 'INVALID_ORG' /* invalid organization member */,
    EXCLUDED = 'EXCLUDED' /* member is already either invited or in the share */,
    LIMIT_REACHED = 'LIMIT_REACHED' /* member limit has been reached */,
}

type ValidateShareInviteOptions = {
    emailField: RefObject<HTMLInputElement>;
    emailValidationResults: Maybe<MutableRefObject<Map<string, boolean>>>;
    store: Store<State>;
};

export const validateInvite =
    ({ emailField, emailValidationResults, store }: ValidateShareInviteOptions) =>
    async (values: InviteFormValues) => {
        const errors: FormikErrors<InviteFormValues> = {};

        if (values.step === 'members') {
            const state = store.getState();

            const { shareId } = values;
            const itemId = values.target === AccessTarget.Item ? values.itemId : undefined;
            const members = selectAccessMembers(shareId, itemId)(state);
            const share = selectShare(values.shareId)(state);
            const emails = { errors: [] as string[], pass: true, seen: new Set<string>() };

            let total = members.size;

            for (const { value } of values.members) {
                total++;
                if (total > (share?.targetMaxMembers ?? 0)) {
                    emails.errors.push(InviteEmailsError.LIMIT_REACHED);
                    emails.pass = false;
                    continue;
                } else if (emails.seen.has(value.email)) {
                    emails.errors.push(InviteEmailsError.DUPLICATE);
                    emails.pass = false;
                    continue;
                } else if (!(await PassUI.is_email_valid(value.email))) {
                    emails.pass = false;
                    emails.errors.push(InviteEmailsError.INVALID_EMAIL);
                    continue;
                } else if (emailValidationResults?.current.get(value.email) === false) {
                    emails.errors.push(InviteEmailsError.INVALID_ORG);
                    emails.pass = false;
                    continue;
                } else if (members.has(value.email)) {
                    emails.errors.push(InviteEmailsError.EXCLUDED);
                    emails.pass = false;
                    continue;
                } else emails.errors.push('');

                emails.seen.add(value.email);
            }

            errors.members = emails.errors;

            /** Determine conditions for displaying trailing input
             * value errors: If the field isn't focused, only show
             * an error if the field is empty and there are no other
             * members in the form. Adapt validation accordingly.  */
            const trailingOnly = values.members.length === 0;
            const trailingFocused = emailField.current === document.activeElement;
            const trailingValue = emailField.current?.value?.trim() ?? '';
            const trailingEmpty = trailingValue.length === 0;
            const trailingValid = !trailingEmpty && (await PassUI.is_email_valid(trailingValue));

            /* If the trailing input is focused, trigger errors if the trailing
             * value is not a valid email address. If it's not focused, flag errors
             * only when the trailing value is invalid and either the field is
             * empty or there are no other members in the form. */
            if (trailingValue && total + 1 > (share?.targetMaxMembers ?? 0)) {
                emails.errors.push(InviteEmailsError.LIMIT_REACHED);
                emails.pass = false;
            } else if (trailingFocused) {
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
