import { type FC } from 'react';

import { Form, type FormikContextType } from 'formik';
import { c } from 'ttag';

import { Icon } from '@proton/components/components';
import type { Share, ShareType } from '@proton/pass/types';

import { IconBox } from '../../../shared/components/icon/IconBox';
import type { InviteFormValues } from '../../../shared/form/types';
import { Field } from '../Field/Field';
import { FieldsetCluster } from '../Field/Layout/FieldsetCluster';
import { RadioGroupField } from '../Field/RadioGroupField';
import { TextField } from '../Field/TextField';
import { shareRoleOptions } from '../Share/ShareRoleOptions';

export const FORM_ID = 'vault-invite';

type Props = { vault: Share<ShareType.Vault>; form: FormikContextType<InviteFormValues> };

export const VaultInviteForm: FC<Props> = ({ vault, form }) => {
    const { email, step } = form.values;
    const vaultName = vault.content.name;

    return (
        <Form id={FORM_ID}>
            {step === 'email' && (
                <>
                    <h2 className="text-xl text-bold mb-3">{c('Title').t`Share with`}</h2>
                    <div className="mb-3 color-weak">
                        {c('Info').t`This user will receive an invitation to join your '${vaultName}' vault.`}
                    </div>

                    <FieldsetCluster>
                        <Field
                            name="email"
                            component={TextField}
                            placeholder={c('Placeholder').t`Email address`}
                            type="email"
                        />
                    </FieldsetCluster>
                </>
            )}

            {step === 'permissions' && (
                <>
                    <h2 className="text-xl text-bold mb-3">{c('Title').t`Permissions`}</h2>
                    <div className="mb-3 color-weak">
                        {c('Info').t`Select the level of access this user will gain when they join your vault.`}
                    </div>
                    <button
                        className="flex flex-align-items-center flex-nowrap gap-3 mb-3"
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
                </>
            )}
        </Form>
    );
};
