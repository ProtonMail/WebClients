import type { FC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import type { MailboxActionVerify } from '@proton/pass/components/Settings/Aliases/AliasMailboxes';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { type EmailFormValues, validateEmailForm } from '@proton/pass/lib/validation/email';
import { createMailbox } from '@proton/pass/store/actions';
import { getEpoch } from '@proton/pass/utils/time/epoch';

export const FORM_ID = 'custom-address-add';
type Props = {
    onClose: () => void;
    onSubmit: (mailboxAction: MailboxActionVerify) => void;
};

/** TODO: maybe edit and reuse packages/pass/components/Monitor/Address/CustomAddressAddModal.tsx instead? */
export const MailboxAddModal: FC<Props> = ({ onClose, onSubmit }) => {
    const { loading, dispatch } = useRequest(createMailbox, {
        onSuccess: ({ data }) => {
            onSubmit({ ...data, sentAt: getEpoch() });
        },
    });

    const form = useFormik<EmailFormValues>({
        initialValues: { email: '' },
        validateOnChange: true,
        validateOnMount: false,
        validate: validateEmailForm,
        onSubmit: ({ email }) => dispatch(email),
    });

    return (
        <SidebarModal onClose={onClose} open>
            {(didEnter) => (
                <Panel
                    loading={loading}
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
                                    onClick={onClose}
                                    title={c('Action').t`Cancel`}
                                >
                                    <Icon name="cross" alt={c('Action').t`Cancel`} />
                                </Button>,
                                <Button
                                    color="norm"
                                    disabled={loading || !form.isValid}
                                    form={FORM_ID}
                                    key="modal-submit-button"
                                    loading={loading}
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
