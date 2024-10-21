import { type FC } from 'react';
import { useDispatch } from 'react-redux';

import type { FormikErrors } from 'formik';
import { Field, Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import type { ConfirmationModalProps } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { vaultDeleteIntent } from '@proton/pass/store/actions';
import type { VaultShareItem } from '@proton/pass/store/reducers';

type ConfirmDeleteValues = { name: string };
type Props = {
    vault: VaultShareItem;
    onSubmit: (shareId: string) => void;
} & Pick<ConfirmationModalProps, 'onClose'>;

const FORM_ID = 'vault-confirm-delete';
const initialValues: ConfirmDeleteValues = { name: '' };

export const VaultDelete: FC<Props> = ({ vault, onClose, onSubmit }) => {
    const dispatch = useDispatch();
    const vaultName = (vault?.content?.name ?? '').trim();

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
            const { content, shareId } = vault;
            dispatch(vaultDeleteIntent({ content, shareId }));
            onSubmit(shareId);
        },
    });

    return (
        <ConfirmationModal
            open
            size="medium"
            onClose={onClose}
            onSubmit={form.submitForm}
            title={c('Title').t`Delete vault "${vaultName}"?`}
            disabled={!form.isValid}
            submitText={c('Action').t`Delete`}
            alertText={c('Warning')
                .t`Vault "${vaultName}" and all its items will be permanently deleted. You cannot undo this action.`}
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
                </Form>
            </FormikProvider>
        </ConfirmationModal>
    );
};
