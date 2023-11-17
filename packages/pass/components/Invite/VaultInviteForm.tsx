import type { VFC } from 'react';
import { useSelector } from 'react-redux';

import { type FormikContextType } from 'formik';
import { c } from 'ttag';

import { Icon } from '@proton/components/components';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { RadioGroupField } from '@proton/pass/components/Form/Field/RadioGroupField';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { IconBox } from '@proton/pass/components/Layout/Icon/IconBox';
import { shareRoleOptions } from '@proton/pass/components/Share/ShareRoleOptions';
import { VaultForm } from '@proton/pass/components/Vault/Vault.form';
import { selectUserVerified } from '@proton/pass/store/selectors';
import type { InviteFormValues } from '@proton/pass/types';

import { UserVerificationMessage } from './UserVerificationMessage';

export const FORM_ID = 'vault-invite';

type Props = { form: FormikContextType<InviteFormValues>; autoFocus?: boolean };

export const VaultInviteForm: VFC<Props> = ({ form, autoFocus }) => {
    const { email, step } = form.values;
    const userVerified = useSelector(selectUserVerified);

    return (
        <>
            {!userVerified && <UserVerificationMessage />}
            {step === 'email' && (
                <div className="anime-fade-in">
                    <h2 className="text-xl text-bold mb-3">{c('Title').t`Share with`}</h2>
                    <FieldsetCluster>
                        <Field
                            name="email"
                            component={TextField}
                            placeholder={c('Placeholder').t`Email address`}
                            type="email"
                            disabled={!userVerified}
                            autoFocus={autoFocus}
                            key={`autofocus-email-${autoFocus}`}
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
                    <h2 className="text-xl text-bold mb-3">{c('Title').t`Set access level`}</h2>
                    <button
                        className="flex items-center flex-nowrap gap-3 mb-3"
                        onClick={() => form.setFieldValue('step', 'email')}
                    >
                        <IconBox size={18} mode="icon" className="flex-item-noshrink">
                            <Icon
                                className={'absolute-center'}
                                color="var(--interaction-norm)"
                                name={'envelope'}
                                size={16}
                            />
                        </IconBox>
                        <div className="text-break-all text-left">{email}</div>
                    </button>
                    <div className="border border-norm rounded pl-4 py-3">
                        <Field
                            name="role"
                            className="flex flex-nowrap gap-2 mr-0"
                            component={RadioGroupField}
                            options={shareRoleOptions()}
                        />
                    </div>
                </div>
            )}
        </>
    );
};
