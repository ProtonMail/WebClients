import type { FC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';

import { useRequest } from '../../../../hooks/useRequest';
import { validateEmailForm } from '../../../../lib/validation/email';
import { aliasCreateContact } from '../../../../store/actions';
import type { AliasCreateContactValues } from '../../../../types';
import { pipe } from '../../../../utils/fp/pipe';
import { Field } from '../../../Form/Field/Field';
import { FieldsetCluster } from '../../../Form/Field/Layout/FieldsetCluster';
import { TextField } from '../../../Form/Field/TextField';
import { SidebarModal } from '../../../Layout/Modal/SidebarModal';
import { Panel } from '../../../Layout/Panel/Panel';
import { PanelHeader } from '../../../Layout/Panel/PanelHeader';
import { useAliasContacts } from './AliasContactsContext';

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
                                    <IcChevronLeft alt={c('Action').t`Cancel`} />
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
