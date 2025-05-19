import { type FC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button, Panel, PanelHeader } from '@proton/atoms';
import { Icon } from '@proton/components/index';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { useRequest } from '@proton/pass/hooks/useRequest';
import type { EmailFormValues } from '@proton/pass/lib/validation/email';
import { validateEmailForm } from '@proton/pass/lib/validation/email';
import { editMailbox } from '@proton/pass/store/actions';

import { useAliasMailboxes } from './AliasMailboxesProvider';

type Props = { mailboxID: number };

const FORM_ID = 'mailbox-change';

export const AliasMailboxEditModal: FC<Props> = ({ mailboxID }) => {
    const { setAction, onMailboxCreated } = useAliasMailboxes();
    const onClose = () => setAction(null);
    const edit = useRequest(editMailbox, { onSuccess: onMailboxCreated });

    const form = useFormik<EmailFormValues>({
        initialValues: { email: '' },
        validateOnChange: true,
        validateOnMount: false,
        validate: validateEmailForm,
        onSubmit: ({ email }) => edit.dispatch({ mailboxID, email }),
    });

    return (
        <SidebarModal onClose={onClose} open>
            {(didEnter) => (
                <Panel
                    loading={edit.loading}
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
                                    disabled={edit.loading || !form.isValid}
                                    form={FORM_ID}
                                    key="modal-submit-button"
                                    loading={edit.loading}
                                    pill
                                    type="submit"
                                >
                                    {c('Action').t`Continue`}
                                </Button>,
                            ]}
                        />
                    }
                >
                    <h2 className="text-xl text-bold mb-4">{c('Title').t`Change mailbox email`}</h2>
                    <FormikProvider value={form}>
                        <Form id={FORM_ID} className="mb-4">
                            <FieldsetCluster>
                                <Field
                                    name="email"
                                    component={TextField}
                                    label={c('Label').t`New email`}
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
