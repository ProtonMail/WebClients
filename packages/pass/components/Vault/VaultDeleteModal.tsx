import { type VFC, useEffect } from 'react';

import type { FormikErrors } from 'formik';
import { Field, Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import type { ConfirmationModalProps } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import type { VaultShareItem } from '@proton/pass/store/reducers';
import type { MaybeNull } from '@proton/pass/types';

type ConfirmDeleteValues = { name: string };
type Props = {
    vault: MaybeNull<VaultShareItem>;
    onSubmit: (vault: VaultShareItem) => void;
} & Pick<ConfirmationModalProps, 'onClose' | 'open'>;

const FORM_ID = 'vault-confirm-delete';
const initialValues: ConfirmDeleteValues = { name: '' };

export const VaultDeleteModal: VFC<Props> = ({ open, vault, onClose, onSubmit }) => {
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
        onSubmit: () => {
            if (vault === null) return;
            onSubmit(vault);
            onClose?.();
        },
    });

    useEffect(() => {
        if (!open) form.resetForm({ values: initialValues, errors: validateVaultDelete(initialValues) });
    }, [open]);

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

                    <span className="color-danger block mt-3 px-5">
                        {c('Warning')
                            .t`Vault "${vaultName}" and all its items will be permanently deleted. You cannot undo this action.`}
                    </span>
                </Form>
            </FormikProvider>
        </ConfirmationModal>
    );
};
