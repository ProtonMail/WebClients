import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

import { useRequest } from '../../../../hooks/useRequest';
import { validateAliasDomain } from '../../../../lib/validation/domain';
import { createCustomDomain } from '../../../../store/actions';
import type { DomainFormValues } from '../../../../types';
import { Field } from '../../../Form/Field/Field';
import { FieldsetCluster } from '../../../Form/Field/Layout/FieldsetCluster';
import { TextField } from '../../../Form/Field/TextField';
import { PassModal } from '../../../Layout/Modal/PassModal';
import { useAliasDomains } from './AliasDomainsContext';

export const FORM_ID = 'custom-domain-add';

export const CustomDomainCreateModal = () => {
    const { onCreate, setAction } = useAliasDomains();
    const onClose = () => setAction(null);

    const { loading, dispatch } = useRequest(createCustomDomain, { onSuccess: onCreate });

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
