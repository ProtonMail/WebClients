import type { FC, ReactNode } from 'react';

import type { FormikErrors } from 'formik';
import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

import { Field } from '../Form/Field/Field';
import { FieldsetCluster } from '../Form/Field/Layout/FieldsetCluster';
import { TextField } from '../Form/Field/TextField';
import { PassModal } from '../Layout/Modal/PassModal';

const FORM_ID = 'folder-form';

type FolderFormValues = { name: string };

type Props = {
    title: ReactNode;
    submitText: string;
    initialName?: string;
    loading: boolean;
    onSubmit: (name: string) => void;
    onClose: () => void;
};

export const FolderFormModal: FC<Props> = ({ title, submitText, initialName = '', loading, onSubmit, onClose }) => {
    const form = useFormik<FolderFormValues>({
        initialValues: { name: initialName },
        validateOnChange: true,
        validateOnMount: true,
        validate: (values) => {
            const errors: FormikErrors<FolderFormValues> = {};
            if (!values.name.trim()) {
                errors.name = c('Warning').t`Folder name is required`;
            }
            return errors;
        },
        onSubmit: ({ name }) => onSubmit(name.trim()),
    });

    return (
        <PassModal onClose={onClose} open onReset={onClose}>
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                <FormikProvider value={form}>
                    <Form id={FORM_ID}>
                        <FieldsetCluster>
                            <Field
                                name="name"
                                component={TextField}
                                placeholder={c('Placeholder').t`Folder name`}
                                label={c('Placeholder').t`Folder name`}
                                autoFocus
                            />
                        </FieldsetCluster>
                    </Form>
                </FormikProvider>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="reset" onClick={onClose}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button color="norm" type="submit" form={FORM_ID} loading={loading} disabled={!form.isValid}>
                    {submitText}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
