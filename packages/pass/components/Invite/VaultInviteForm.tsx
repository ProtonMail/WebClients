import { type ForwardRefRenderFunction, type MutableRefObject, forwardRef, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { type FormikContextType } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import type { ListFieldValue } from '@proton/pass/components/Form/Field/ListField';
import { ListField } from '@proton/pass/components/Form/Field/ListField';
import { UserVerificationMessage } from '@proton/pass/components/Invite/UserVerificationMessage';
import { VaultForm } from '@proton/pass/components/Vault/Vault.form';
import { type InviteAddressValidator } from '@proton/pass/hooks/useValidateInviteAddress';
import { InviteEmailsError } from '@proton/pass/lib/validation/vault-invite';
import { selectUserVerified, selectVaultSharedWithEmails } from '@proton/pass/store/selectors';
import type { InviteFormMemberValue, MaybeNull } from '@proton/pass/types';
import { type InviteFormValues, ShareRole } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import clsx from '@proton/utils/clsx';

import { SharedVaultItem } from '../Vault/SharedVaultItem';
import { BulkMemberActions } from './BulkMemberActions';
import { InviteMember } from './InviteMember';
import { InviteRecommendations } from './InviteRecommendations';

export const FORM_ID = 'vault-invite';

type Props = {
    addressValidator: InviteAddressValidator;
    autoFocus?: boolean;
    form: FormikContextType<InviteFormValues>;
};

/** `VaultInviteForm` takes a forwarded ref parameter for the email input element.
 * This ref is essential to trigger validation on any non-added email values that
 * are pushed to the member list. This ensures correct interaction with the invite
 * recommendations. */
const ForwardedVaultInviteForm: ForwardRefRenderFunction<HTMLInputElement, Props> = (
    { form, autoFocus, addressValidator },
    fieldRef
) => {
    const emailField = (fieldRef as MaybeNull<MutableRefObject<HTMLInputElement>>)?.current;
    const { step, members, withVaultCreation } = form.values;
    const shareId = form.values.withVaultCreation ? '' : form.values.shareId;

    const [autocomplete, setAutocomplete] = useState('');
    const userVerified = useSelector(selectUserVerified);
    const vaultSharedWith = useSelector(selectVaultSharedWithEmails(shareId));

    const selected = useMemo(() => new Set<string>(members.map((member) => member.value.email)), [members]);

    /** Filter out emails pending validation by comparing against the address validator cache.
     * Pending emails are those present in 'members' but not in the validator cache */
    const emailsValidating = useMemo(
        () => members.filter(({ value }) => !addressValidator.emails.current.has(value.email)),
        [members]
    );

    const createMember = (email: string): ListFieldValue<InviteFormMemberValue> => ({
        value: { email, role: ShareRole.READ },
        id: uniqueId(),
    });

    const onEmailFieldBlur = (maybeEmail: string) => {
        const value = maybeEmail.trim();
        if (validateEmailAddress(value) && emailField) {
            emailField.value = '';
            void form.setFieldValue('members', members.concat([createMember(value)]));
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

        void form.setFieldValue('members', update);
    };

    useEffect(() => setAutocomplete(''), [form.values.step]);

    const getVaultHeader = (customizable: boolean = false) => (
        <div
            className={clsx(
                'flex justify-space-between items-center flex-nowrap mt-3 mb-6 gap-3',
                customizable && 'border rounded-xl p-3'
            )}
        >
            <SharedVaultItem {...form.values} />
            {customizable && (
                <Button
                    className="shrink-0"
                    color="weak"
                    onClick={() => form.setFieldValue('step', 'vault')}
                    pill
                    shape="solid"
                >
                    {c('Action').t`Customize`}
                </Button>
            )}
        </div>
    );

    return (
        <>
            {!userVerified && <UserVerificationMessage />}
            {step === 'members' && (
                <div className="anime-fade-in h-full flex flex-column">
                    {getVaultHeader(withVaultCreation)}
                    <h2 className="text-xl text-bold mb-3">{c('Title').t`Share with`}</h2>

                    <FieldsetCluster>
                        <Field
                            autoFocus={autoFocus}
                            component={ListField<InviteFormValues>}
                            disabled={!userVerified || addressValidator.loading}
                            fieldLoading={(entry) => addressValidator.loading && emailsValidating.includes(entry)}
                            fieldKey="members"
                            fieldRef={fieldRef}
                            fieldValue={prop('email')}
                            key={`autofocus-email-${autoFocus}`}
                            name="emails"
                            onBlur={onEmailFieldBlur}
                            onPush={createMember}
                            onReplace={(email, prev) => ({ ...prev, value: { ...prev.value, email } })}
                            placeholder={c('Placeholder').t`Email address`}
                            renderError={(err) => {
                                const errors = err as string[];

                                const isEmpty = errors.includes(InviteEmailsError.EMPTY);
                                if (isEmpty) return c('Warning').t`At least one email address is required`;

                                const hasDuplicates = errors.includes(InviteEmailsError.DUPLICATE);
                                const hasInvalid = errors.includes(InviteEmailsError.INVALID_EMAIL);
                                const hasOrganizationLimits = errors.includes(InviteEmailsError.INVALID_ORG);

                                return (
                                    <>
                                        {hasOrganizationLimits &&
                                            c('Warning')
                                                .t`Inviting email addresses outside organization is not allowed.`}
                                        {hasDuplicates && c('Warning').t`Duplicate email addresses.` + ` `}
                                        {hasInvalid && c('Warning').t`Invalid email addresses.`}
                                    </>
                                );
                            }}
                            onAutocomplete={setAutocomplete}
                        />
                    </FieldsetCluster>

                    <div className="flex flex-nowrap flex-column flex-1 gap-2 mt-3">
                        <InviteRecommendations
                            autocomplete={autocomplete}
                            selected={selected}
                            excluded={vaultSharedWith}
                            shareId={!form.values.withVaultCreation ? form.values.shareId : undefined}
                            onToggle={onRecommendationToggle}
                        />
                    </div>
                </div>
            )}

            {step === 'vault' && (
                <div className="flex flex-column gap-y-4 anime-fade-in">
                    <VaultForm form={form as FormikContextType<InviteFormValues<true>>} autoFocus={autoFocus} />
                </div>
            )}

            {step === 'permissions' && (
                <div className="anime-fade-in">
                    {getVaultHeader()}
                    <h2 className="text-xl text-bold mb-2">{c('Title').t`Set access level`}</h2>
                    <div className="w-full flex flex-nowrap items-center justify-between gap-3 mb-3 text-lg">
                        <div className="flex-auto shrink-0">
                            <button
                                className="text-break-all text-left color-weak text-semibold"
                                onClick={() => form.setFieldValue('step', 'members')}
                            >
                                {c('Title').t`Members`} ({members.length})
                            </button>
                        </div>

                        <BulkMemberActions
                            onRoleChange={(role) =>
                                form.setFieldValue(
                                    'members',
                                    members.map(({ id, value }) => ({ id, value: { ...value, role } }))
                                )
                            }
                        />
                    </div>
                    <div className="py-3">
                        {members.map((member) => (
                            <InviteMember
                                {...member}
                                key={`member-${member.id}`}
                                onRemove={() => {
                                    const update = members.filter(({ id }) => id !== member.id);
                                    void form.setFieldValue('members', update);
                                    void form.setFieldValue('step', update.length === 0 ? 'members' : 'permissions');
                                }}
                                onRoleChange={(role) =>
                                    form.setFieldValue(
                                        'members',
                                        members.map(({ id, value }) => ({
                                            id,
                                            value: { ...value, role: id === member.id ? role : value.role },
                                        }))
                                    )
                                }
                            />
                        ))}
                    </div>
                </div>
            )}

            {step === 'review' && (
                <div className="anime-fade-in">
                    <h2 className="text-xl text-bold my-4">{c('Title').t`Review and share`}</h2>
                    <div className="color-weak text-semibold"> {c('Title').t`Vault`}</div>
                    {getVaultHeader()}

                    <div className="color-weak text-semibold"> {c('Label').t`Members`}</div>
                    {members.map((member) => (
                        <InviteMember {...member} key={`review-${member.id}`} />
                    ))}
                </div>
            )}
        </>
    );
};

export const VaultInviteForm = forwardRef(ForwardedVaultInviteForm);
