import type { FC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, type ModalStateProps } from '@proton/components';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { useAliasContacts } from '@proton/pass/components/Item/Alias/Contact/AliasContactsContext';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { validateEmailForm } from '@proton/pass/lib/validation/email';
import { aliasCreateContact } from '@proton/pass/store/actions';
import type { AliasCreateContactValues } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

const FORM_ID = 'create-contact-form';

type Props = Pick<ModalStateProps, 'onClose'>;

export const AliasContactCreate: FC<Props> = ({ onClose }) => {
    const { itemId, shareId, onCreate } = useAliasContacts();
    const { loading, dispatch } = useRequest(aliasCreateContact, { onSuccess: pipe(onCreate, onClose) });

    const form = useFormik<AliasCreateContactValues>({
        initialValues: { email: '' },
        validateOnChange: true,
        validateOnMount: false,
        validate: validateEmailForm,
        onSubmit: ({ email }) => dispatch({ itemId, shareId, email }),
    });

    return (
        <SidebarModal className="ui-teal" onClose={onClose} open>
            {(didEnter) => (
                <Panel
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
                                    <Icon name="chevron-left" alt={c('Action').t`Cancel`} />
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
