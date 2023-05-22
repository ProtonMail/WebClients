import { type VFC, useEffect } from 'react';

import type { FormikErrors } from 'formik';
import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import type { MaybeNull, VaultShare } from '@proton/pass/types';
import { VaultColor } from '@proton/pass/types/protobuf/vault-v1';
import { truthy } from '@proton/pass/utils/fp';

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
        onSubmit: ({ destination }) => onSubmit(destination === 'delete' ? null : destination),
    });

    useEffect(() => {
        if (!open) form.resetForm({ values: initialValues, errors: validateVaultDelete(initialValues) });
    }, [open]);

    const deleteItems = form.values.destination === 'delete';

    return (
        <ConfirmationModal
            open={open}
            size="medium"
            onClose={onClose}
            onSubmit={form.submitForm}
            title={c('Title').t`Delete vault "${vaultName}" ?`}
            disabled={!form.isValid}
            submitText={c('Action').t`Delete`}
            alertText={
                deleteItems
                    ? c('Warning')
                          .t`Vault "${vault?.content.name}" and all its items will be permanently deleted. You can not undo this action`
                    : undefined
            }
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

                    {!deleteItems && (
                        <span className="block text-weak text-sm text-italic mt-2 mb-3">{c('Info')
                            .t`You can move all items in the vault to another vault.`}</span>
                    )}
                    <FieldsetCluster>
                        <Field
                            name="destination"
                            label={c('Label').t`Items destination`}
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
                </Form>
            </FormikProvider>
        </ConfirmationModal>
    );
};
