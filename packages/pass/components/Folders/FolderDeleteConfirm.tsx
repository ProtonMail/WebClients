import type { FC } from 'react';

import type { FormikErrors } from 'formik';
import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { useRequest } from '../../hooks/useRequest';
import { folderDelete } from '../../store/actions';
import type { ConfirmationModalProps } from '../Confirmation/ConfirmationModal';
import { ConfirmationModal } from '../Confirmation/ConfirmationModal';
import { Field } from '../Form/Field/Field';
import { FieldsetCluster } from '../Form/Field/Layout/FieldsetCluster';
import { TextField } from '../Form/Field/TextField';

type ConfirmDeleteValues = { name: string };

interface Props extends Pick<ConfirmationModalProps, 'onClose'> {
    shareId: string;
    folderId: string;
    folderName: string;
}

const FORM_ID = 'folder-confirm-delete';
const initialValues: ConfirmDeleteValues = { name: '' };

export const FolderDeleteConfirm: FC<Props> = ({ shareId, folderId, folderName, onClose }) => {
    const { loading, dispatch } = useRequest(folderDelete, { onSuccess: onClose });
    const name = folderName.trim();

    const validateFolderDelete = ({ name: value }: ConfirmDeleteValues) => {
        const errors: FormikErrors<ConfirmDeleteValues> = {};
        if (!value || value !== name) errors.name = c('Error').t`Folder name does not match`;
        return errors;
    };

    const form = useFormik<ConfirmDeleteValues>({
        initialValues,
        initialErrors: validateFolderDelete(initialValues),
        validateOnChange: true,
        validateOnMount: true,
        validate: validateFolderDelete,
        onSubmit: () => dispatch({ shareId, folderIds: [folderId] }),
    });

    return (
        <ConfirmationModal
            open
            size="medium"
            onClose={onClose}
            onSubmit={form.submitForm}
            closeAfterSubmit={false}
            title={c('Title').t`Delete folder "${name}"?`}
            disabled={!form.isValid || loading}
            submitText={c('Action').t`Delete`}
            alertText={c('Warning')
                .t`All items in this folder including its subfolders will be deleted. You cannot undo this action.`}
        >
            <FormikProvider value={form}>
                <Form id={FORM_ID}>
                    <FieldsetCluster>
                        <Field
                            name="name"
                            label={c('Label').t`Confirm folder name`}
                            component={TextField}
                            placeholder={c('Placeholder').t`Retype "${name}" to confirm deletion`}
                            autoFocus
                        />
                    </FieldsetCluster>
                </Form>
            </FormikProvider>
        </ConfirmationModal>
    );
};
