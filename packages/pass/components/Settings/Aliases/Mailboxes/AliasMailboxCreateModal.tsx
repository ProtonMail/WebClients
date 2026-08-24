import type { FC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCross } from '@proton/icons/icons/IcCross';

import { useRequest } from '../../../../hooks/useRequest';
import { type EmailFormValues, validateEmailForm } from '../../../../lib/validation/email';
import { createMailbox } from '../../../../store/actions';
import { Field } from '../../../Form/Field/Field';
import { FieldsetCluster } from '../../../Form/Field/Layout/FieldsetCluster';
import { TextField } from '../../../Form/Field/TextField';
import { SidebarModal } from '../../../Layout/Modal/SidebarModal';
import { Panel } from '../../../Layout/Panel/Panel';
import { PanelHeader } from '../../../Layout/Panel/PanelHeader';
import { useAliasMailboxes } from './AliasMailboxesContext';

export const FORM_ID = 'custom-address-add';

export const AliasMailboxCreateModal: FC = () => {
    const { setAction, onMailboxCreated } = useAliasMailboxes();
    const onClose = () => setAction(null);
    const create = useRequest(createMailbox, { onSuccess: onMailboxCreated });

    const form = useFormik<EmailFormValues>({
        initialValues: { email: '' },
        validateOnChange: true,
        validateOnMount: false,
        validate: validateEmailForm,
        onSubmit: ({ email }) => create.dispatch(email),
    });

    return (
        <SidebarModal onClose={onClose} open>
            {(didEnter) => (
                <Panel
                    loading={create.loading}
                    header={
                        <PanelHeader
                            actions={[
                                <Button
                                    key="cancel-button"
                                    icon
                                    pill
                                    shape="solid"
                                    color="weak"
                                    onClick={onClose}
                                    title={c('Action').t`Cancel`}
                                >
                                    <IcCross alt={c('Action').t`Cancel`} />
                                </Button>,
                                <Button
                                    color="norm"
                                    disabled={create.loading || !form.isValid}
                                    form={FORM_ID}
                                    key="modal-submit-button"
                                    loading={create.loading}
                                    pill
                                    type="submit"
                                >
                                    {c('Action').t`Continue`}
                                </Button>,
                            ]}
                        />
                    }
                >
                    <h2 className="text-xl text-bold mb-4">{c('Title').t`Add mailbox`}</h2>
                    <FormikProvider value={form}>
                        <Form id={FORM_ID} className="mb-4">
                            <FieldsetCluster>
                                <Field
                                    name="email"
                                    component={TextField}
                                    label={c('Label').t`Email`}
                                    placeholder={c('Placeholder').t`me@example.com`}
                                    autoFocus={didEnter}
                                    key={`mailbox-address-add-${didEnter}`}
                                />
                            </FieldsetCluster>
                        </Form>
                    </FormikProvider>
                </Panel>
            )}
        </SidebarModal>
    );
};
