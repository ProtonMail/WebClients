import { type FC, useEffect } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, type ModalStateProps } from '@proton/components';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { validateEmailForm } from '@proton/pass/lib/validation/email';
import { aliasCreateContact } from '@proton/pass/store/actions';
import type { AliasContactGetResponse, AliasCreateContactValues, UniqueItem } from '@proton/pass/types';

const FORM_ID = 'create-contact-form';

type Props = ModalStateProps & UniqueItem & { onContactCreated: (contact: AliasContactGetResponse) => void };

export const SidebarCreateContact: FC<Props> = ({ itemId, shareId, open, onClose, onContactCreated }) => {
    const { loading, dispatch } = useRequest(aliasCreateContact, {
        onSuccess: ({ data }) => {
            onContactCreated(data);
            onClose();
        },
    });

    const form = useFormik<AliasCreateContactValues>({
        initialValues: { email: '' },
        validateOnChange: true,
        validateOnMount: false,
        validate: validateEmailForm,
        onSubmit: ({ email }) => dispatch({ itemId, shareId, email }),
    });

    useEffect(() => {
        if (open) form.resetForm();
    }, [open]);

    return (
        <SidebarModal className="ui-teal" onClose={onClose} open={open}>
            {(didEnter) => (
                <Panel
                    className="pass-panel--full"
                    header={
                        <PanelHeader
                            actions={[
                                <Button
                                    key="cancel-button"
                                    icon
                                    pill
                                    shape="solid"
                                    color="weak"
                                    disabled={loading}
                                    onClick={onClose}
                                    title={c('Action').t`Cancel`}
                                >
                                    <Icon name="cross" alt={c('Action').t`Cancel`} />
                                </Button>,
                                <Button
                                    color="norm"
                                    key="modal-submit-button"
                                    pill
                                    type="submit"
                                    form={FORM_ID}
                                    disabled={loading}
                                    loading={loading}
                                >
                                    {c('Action').t`Save`}
                                </Button>,
                            ]}
                        />
                    }
                >
                    <h2 className="text-xl text-bold my-3">{c('Title').t`Create contact`}</h2>
                    <FormikProvider value={form}>
                        <Form id={FORM_ID}>
                            <FieldsetCluster>
                                <Field
                                    name="email"
                                    placeholder={c('Placeholder').t`Email address`}
                                    component={TextField}
                                    autoFocus={didEnter}
                                    key={`create-contact-${didEnter}`}
                                />
                            </FieldsetCluster>
                        </Form>
                    </FormikProvider>
                </Panel>
            )}
        </SidebarModal>
    );
};
