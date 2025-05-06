import type { ClipboardEvent, MutableRefObject, ReactNode } from 'react';
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { ListField } from '@proton/pass/components/Form/Field/ListField';
import { InviteRecommendations } from '@proton/pass/components/Invite/Steps/InviteRecommendations';
import type { InviteAddressValidator } from '@proton/pass/hooks/invite/useAddressValidator';
import type { AccessKeys } from '@proton/pass/lib/access/types';
import PassUI from '@proton/pass/lib/core/ui.proxy';
import { InviteEmailsError } from '@proton/pass/lib/validation/invite';
import type { InviteFormMemberItem, MaybeNull } from '@proton/pass/types';
import { type InviteFormValues, ShareRole } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

const createMember = (email: string): InviteFormMemberItem => ({
    value: { email, role: ShareRole.READ },
    id: uniqueId(),
});

type Props = {
    access: AccessKeys;
    autoFocus?: boolean;
    disabled?: boolean;
    excluded: Set<string>;
    heading?: ReactNode;
    members: InviteFormMemberItem[];
    validator: MaybeNull<InviteAddressValidator>;
    onUpdate: (members: InviteFormMemberItem[]) => Promise<void>;
};

const getFieldValue = prop('email');

/** `InviteStepMembers` takes a forwarded ref parameter for the email
 * input element. This ref is essential to trigger validation on any
 * non-added email values that are are pushed to the member list. This
 * ensures correct interaction with the invite recommendations. */
export const InviteStepMembers = forwardRef<HTMLInputElement, Props>(
    ({ access, autoFocus, disabled, excluded, heading, members, validator, onUpdate }, fieldRef) => {
        const emailField = (fieldRef as MaybeNull<MutableRefObject<HTMLInputElement>>)?.current;
        const scrollTimer = useRef<MaybeNull<NodeJS.Timeout>>(null);

        const [autocomplete, setAutocomplete] = useState('');
        const selected = useMemo(() => new Set<string>(members.map((member) => member.value.email)), [members]);

        /** Filter out emails pending validation by comparing against the
         * address validator cache. Pending emails are those present in
         * `members` but not in the validator's results cache */
        const emailsValidating = useMemo(
            () => (validator ? members.filter(({ value }) => !validator.emails.current.has(value.email)) : []),
            [members]
        );

        const fieldLoading = useCallback(
            (entry: InviteFormMemberItem) => (validator?.loading ?? false) && emailsValidating.includes(entry),
            [validator, emailsValidating]
        );

        const onEmailFieldBlur = async (maybeEmail: string) => {
            const value = maybeEmail.trim();
            if ((await PassUI.is_email_valid(value)) && emailField) {
                emailField.value = '';
                void onUpdate(members.concat([createMember(value)]));
            }
        };

        const onRecommendationToggle = (email: string, checked: boolean) => {
            const update = checked
                ? members.concat([createMember(email)])
                : members.filter(({ value }) => value.email !== email);

            if (checked) {
                /** If the trailing email field value matches the beginning of one of
                 * the suggestions, it is assumed that the user wishes to autocomplete. */
                const trailing = (emailField?.value ?? '').trim().toLowerCase();
                if (emailField && email.toLowerCase().startsWith(trailing)) emailField.value = '';
            }

            void onUpdate(update);
        };

        const handlePaste = async (evt: ClipboardEvent<HTMLInputElement>) => {
            evt.preventDefault();

            if (scrollTimer.current) {
                clearTimeout(scrollTimer.current);
                scrollTimer.current = null;
            }

            const value = evt.clipboardData?.getData('text/plain') || '';

            const emails = value
                .split(/[,;\s\n\t]+/)
                .map((email) => email.trim())
                .filter((email) => email.length > 0)
                .map(createMember);

            await onUpdate(members.concat(emails));

            scrollTimer.current = setTimeout(() => {
                emailField?.scrollIntoView({ behavior: 'smooth' });
                scrollTimer.current = null;
            }, 25);
        };

        useEffect(
            () => () => {
                if (scrollTimer.current) clearTimeout(scrollTimer.current);
            },
            []
        );

        return (
            <div className="anime-fade-in h-full flex flex-nowrap flex-column gap-y-3 *:shrink-0">
                {heading}
                <h2 className="text-xl text-bold">{c('Title').t`Share with`}</h2>

                <FieldsetCluster>
                    <Field
                        autoFocus={autoFocus}
                        component={ListField<InviteFormValues>}
                        disabled={disabled || validator?.loading}
                        fieldLoading={fieldLoading}
                        fieldKey="members"
                        fieldRef={fieldRef}
                        fieldValue={getFieldValue}
                        key={`autofocus-email-${autoFocus}`}
                        name="emails"
                        onBlur={onEmailFieldBlur}
                        onPush={createMember}
                        onReplace={(email, prev) => ({ ...prev, value: { ...prev.value, email } })}
                        placeholder={c('Placeholder').t`Email address`}
                        onPaste={handlePaste}
                        renderError={(err) => {
                            const errors = err as string[];

                            const isEmpty = errors.includes(InviteEmailsError.EMPTY);
                            if (isEmpty) return c('Warning').t`At least one email address is required`;

                            const hasDuplicates = errors.includes(InviteEmailsError.DUPLICATE);
                            const hasInvalid = errors.includes(InviteEmailsError.INVALID_EMAIL);
                            const hasOrganizationLimits = errors.includes(InviteEmailsError.INVALID_ORG);
                            const hasExcluded = errors.includes(InviteEmailsError.EXCLUDED);

                            return (
                                <>
                                    {hasOrganizationLimits &&
                                        c('Warning').t`Inviting email addresses outside organization is not allowed.`}
                                    {hasDuplicates && c('Warning').t`Duplicate email addresses.` + ` `}
                                    {hasInvalid && c('Warning').t`Invalid email addresses.`}
                                    {hasExcluded && c('Warning').t`Addresses already invited.`}
                                </>
                            );
                        }}
                        onAutocomplete={(value) => setAutocomplete(value.trim())}
                    />
                </FieldsetCluster>

                <div className="flex flex-1 flex-nowrap flex-column gap-2">
                    {!disabled && (
                        <InviteRecommendations
                            access={access}
                            autocomplete={autocomplete}
                            excluded={excluded}
                            selected={selected}
                            onToggle={onRecommendationToggle}
                        />
                    )}
                </div>
            </div>
        );
    }
);

InviteStepMembers.displayName = 'InviteStepMembersForwarded';
