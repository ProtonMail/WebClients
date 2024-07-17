import { type FC } from 'react';

import { Form, type FormikErrors, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, ModalTwoContent, ModalTwoHeader, useModalState } from '@proton/components/components';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';

const formId = 'identity-new-section-modal';

type IdentityAddNewSectionProps = {
    onAdd: (v: string) => void;
};

export const IdentityAddNewSection: FC<IdentityAddNewSectionProps> = ({ onAdd }) => {
    const [{ open, onClose }, setModal] = useModalState();

    const form = useFormik({
        initialValues: { value: '' },
        onSubmit: ({ value }) => {
            onAdd(value);
            onClose();
        },
        validate: ({ value }) => {
            const errors: FormikErrors<{ value: string }> = {};

            if (!Boolean(value.length)) {
                errors.value = c('Validation').t`Section name cannot be empty`;
            }

            return { ...errors };
        },
        validateOnBlur: true,
    });

    return (
        <>
            <Button
                className="rounded-full w-full"
                style={{ backgroundColor: 'var(--interaction-weak)' }}
                color="norm"
                shape="ghost"
                onClick={() => setModal(true)}
            >
                <div className="flex items-center justify-center">
                    <Icon name="plus" />
                    <div className="ml-2 text-semibold">{c('Label').t`Add section`}</div>
                </div>
            </Button>
            <PassModal size="small" open={open} enableCloseWhenClickOutside onClose={onClose}>
                <ModalTwoHeader title={c('Action').t`Custom section`} />
                <FormikProvider value={form}>
                    <Form id={formId}>
                        <ModalTwoContent>
                            <FieldsetCluster>
                                <Field
                                    component={TextField}
                                    label={c('Action').t`Section name`}
                                    error={form.errors.value}
                                    name="value"
                                    type="text"
                                    unstyled
                                />
                            </FieldsetCluster>

                            <Button
                                className="rounded-full w-full mt-2"
                                style={{ backgroundColor: 'var(--interaction-weak)' }}
                                form={formId}
                                disabled={!form.isValid}
                                color="norm"
                                shape="ghost"
                                type="submit"
                            >
                                <span className="text-ellipsis">{c('Action').t`Add section`}</span>
                            </Button>
                        </ModalTwoContent>
                    </Form>
                </FormikProvider>
            </PassModal>
        </>
    );
};
