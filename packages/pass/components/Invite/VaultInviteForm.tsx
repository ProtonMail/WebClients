import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { type FormikContextType } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { ListField } from '@proton/pass/components/Form/Field/ListField';
import { UserVerificationMessage } from '@proton/pass/components/Invite/UserVerificationMessage';
import { VaultForm } from '@proton/pass/components/Vault/Vault.form';
import { selectUserVerified } from '@proton/pass/store/selectors';
import { type InviteFormValues, ShareRole } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import clsx from '@proton/utils/clsx';

import { SharedVaultItem } from '../Vault/SharedVaultItem';
import { BulkMemberActions } from './BulkMemberActions';
import { InviteMember } from './InviteMember';

export const FORM_ID = 'vault-invite';

type Props = { form: FormikContextType<InviteFormValues>; autoFocus?: boolean };

export const VaultInviteForm: FC<Props> = ({ form, autoFocus }) => {
    const { step, members, withVaultCreation } = form.values;
    const userVerified = useSelector(selectUserVerified);

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
                <div className="anime-fade-in">
                    {getVaultHeader(withVaultCreation)}
                    <h2 className="text-xl text-bold mb-3">{c('Title').t`Share with`}</h2>
                    <FieldsetCluster>
                        <Field
                            autoFocus={autoFocus}
                            component={ListField<InviteFormValues>}
                            disabled={!userVerified}
                            fieldKey="members"
                            fieldValue={prop('email')}
                            key={`autofocus-email-${autoFocus}`}
                            name="emails"
                            onPush={(email) => ({ value: { email, role: ShareRole.READ }, id: uniqueId() })}
                            onReplace={(email, prev) => ({ ...prev, value: { ...prev.value, email } })}
                            placeholder={c('Placeholder').t`Email address`}
                            renderError={() => c('Warning').t`Invalid email addresses`}
                        />
                    </FieldsetCluster>
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
                    <div className="w-full flex items-end justify-between gap-3 mb-3 text-lg">
                        <div className="flex-1">
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
