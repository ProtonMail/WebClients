import { type VFC, useEffect } from 'react';
import { useSelector } from 'react-redux';

import type { FormikErrors } from 'formik';
import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { selectShare } from '@proton/pass/store';
import type { MaybeNull, ShareType, VaultShare } from '@proton/pass/types';
import { VaultColor } from '@proton/pass/types/protobuf/vault-v1';
import { truthy } from '@proton/pass/utils/fp';
import clsx from '@proton/utils/clsx';

import { ConfirmationModal, type ConfirmationModalProps } from '../../../shared/components/confirmation';
import { Field } from '../Field/Field';
import { FieldsetCluster } from '../Field/Layout/FieldsetCluster';
import { TextField } from '../Field/TextField';
import { VaultSelectField } from '../Field/VaultSelectField';

type ConfirmDeleteValues = { name: string; destination: string };
type Props = {
    vault: MaybeNull<VaultShare>;
    onSubmit: (destinationShareId: MaybeNull<string>) => void;
} & Pick<ConfirmationModalProps, 'open' | 'onClose'>;

const FORM_ID = 'vault-confirm-delete';
const initialValues: ConfirmDeleteValues = { name: '', destination: 'delete' };

export const VaultDeleteModal: VFC<Props> = ({ vault, open, onClose, onSubmit }) => {
    const vaultName = vault?.content?.name ?? '';

    const validateVaultDelete = ({ name }: ConfirmDeleteValues) => {
        const errors: FormikErrors<ConfirmDeleteValues> = {};
        if (!name || name !== vaultName) errors.name = c('Error').t`Vault name does not match`;
        return errors;
    };

    const form = useFormik<ConfirmDeleteValues>({
        initialValues,
        initialErrors: validateVaultDelete(initialValues),
        validateOnChange: true,
        validateOnMount: true,
        validate: validateVaultDelete,
        onSubmit: ({ destination }) => {
            onSubmit(destination === 'delete' ? null : destination);
            onClose?.();
        },
    });

    useEffect(() => {
        if (!open) form.resetForm({ values: initialValues, errors: validateVaultDelete(initialValues) });
    }, [open]);

    const deleteItems = form.values.destination === 'delete';
    const destinationVaultName = useSelector(selectShare<ShareType.Vault>(form.values.destination))?.content.name;

    return (
        <ConfirmationModal
            open={open}
            size="medium"
            onClose={onClose}
            onSubmit={form.submitForm}
            title={c('Title').t`Delete vault "${vaultName}" ?`}
            disabled={!form.isValid}
            submitText={c('Action').t`Delete`}
        >
            <FormikProvider value={form}>
                <Form id={FORM_ID}>
                    <FieldsetCluster>
                        <Field
                            name="name"
                            label={c('Label').t`Confirm vault name`}
                            component={TextField}
                            placeholder={c('Placeholder').t`Retype "${vaultName}" to confirm deletion`}
                            autoFocus
                        />
                    </FieldsetCluster>

                    <FieldsetCluster>
                        <Field
                            name="destination"
                            label={c('Label').t`Move items to`}
                            component={VaultSelectField}
                            placeholder={c('Placeholder').t`Move items to another vault (optional)`}
                            excludeOptions={[vault?.shareId].filter(truthy)}
                            extraOptions={[
                                {
                                    value: 'delete',
                                    icon: 'pass-trash',
                                    color: VaultColor.COLOR7 /* danger color */,
                                    title: c('Label').t`Permanently delete items`,
                                },
                            ]}
                        />
                    </FieldsetCluster>

                    <span className={clsx(deleteItems ? 'color-danger' : 'color-weak', 'block mt-3 px-5')}>
                        {deleteItems
                            ? c('Warning')
                                  .t`Vault "${vaultName}" and all its items will be permanently deleted. You can not undo this action`
                            : c('Warning')
                                  .t`Vault "${vaultName}" will be permanently deleted and all its items moved to "${destinationVaultName}"`}
                    </span>
                </Form>
            </FormikProvider>
        </ConfirmationModal>
    );
};
