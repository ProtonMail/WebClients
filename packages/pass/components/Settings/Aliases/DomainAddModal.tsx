import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { validateAliasDomain } from '@proton/pass/lib/validation/domain';
import { createCustomDomain } from '@proton/pass/store/actions';
import type { CustomDomainOutput } from '@proton/pass/types';

export const FORM_ID = 'custom-domain-add';

export type DomainFormValues = {
    domain: string;
};

export type ConfirmationModalProps = {
    onClose: () => void;
    onSubmit: (customDomain: CustomDomainOutput) => void;
};

export const DomainAddModal = ({ onClose, onSubmit }: ConfirmationModalProps) => {
    const { loading, dispatch } = useRequest(createCustomDomain, { onSuccess: onSubmit });

    const form = useFormik<DomainFormValues>({
        initialValues: { domain: '' },
        validateOnChange: true,
        validateOnMount: false,
        validate: validateAliasDomain,
        onSubmit: ({ domain }) => dispatch(domain),
    });

    return (
        <PassModal onClose={onClose} open onReset={onClose}>
            <ModalTwoHeader title={c('Title').t`Add custom domain`} />
            <ModalTwoContent>
                <FormikProvider value={form}>
                    <Form id={FORM_ID} className="mb-4">
                        <FieldsetCluster>
                            <Field
                                name="domain"
                                component={TextField}
                                placeholder={c('Placeholder').t`my-domain.com`}
                                autoFocus
                            />
                        </FieldsetCluster>
                    </Form>
                </FormikProvider>
                <div>{c('Info')
                    .t`Please use full path domain, for example my-domain.com or my-subdomain.my-domain.com if you are using a subdomain.`}</div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="reset" onClick={onClose}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button color="norm" type="submit" form={FORM_ID} loading={loading} disabled={!form.isValid}>
                    {c('Action').t`Create`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
