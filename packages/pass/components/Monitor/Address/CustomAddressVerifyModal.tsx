import type { FC, ReactNode } from 'react';

import { Form, type FormikErrors, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, type ModalProps } from '@proton/components/index';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import type { AddressType, MonitorAddress } from '@proton/pass/lib/monitor/types';
import { verifyCustomAddress } from '@proton/pass/store/actions';
import { isNumber } from '@proton/shared/lib/helpers/validators';

export const FORM_ID = 'custom-address-verify';

type Props = ModalProps & MonitorAddress<AddressType.CUSTOM>;
type FormValues = { code: string };

export const CustomAddressVerifyModal: FC<Props> = ({ onClose, email, addressId, ...props }) => {
    const { loading, dispatch } = useRequest(verifyCustomAddress, { onSuccess: onClose });

    const form = useFormik<FormValues>({
        initialValues: { code: '' },
        validateOnChange: true,
        validateOnMount: false,
        validate: ({ code }) => {
            let errors: FormikErrors<FormValues> = {};
            if (!code) errors.code = c('Warning').t`Verification code is required`;
            if (!isNumber(code)) errors.code = c('Warning').t`Invalid code`;
            return errors;
        },
        onSubmit: ({ code }) => dispatch({ addressId, code }),
    });

    return (
        <SidebarModal onClose={onClose} open {...props}>
            {(didEnter): ReactNode => (
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
                                    {c('Action').t`Confirm`}
                                </Button>,
                            ]}
                        />
                    }
                >
                    <h2 className="text-xl text-bold mb-3">{c('Title').t`Confirm your email`}</h2>
                    <p>{c('Info').t`We’ve sent a verification code to ${email}. Please enter it below:`}</p>
                    <FormikProvider value={form}>
                        <Form id={FORM_ID}>
                            <FieldsetCluster>
                                <Field
                                    name="code"
                                    component={TextField}
                                    label={c('Label').t`Code`}
                                    type="number"
                                    placeholder="123456"
                                    autoFocus={didEnter}
                                    key={`custom-address-verify-${didEnter}`}
                                />
                            </FieldsetCluster>
                        </Form>
                    </FormikProvider>
                </Panel>
            )}
        </SidebarModal>
    );
};
