import type { FC } from 'react';

import { Form, type FormikErrors, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCross } from '@proton/icons/icons/IcCross';

import { useRequest } from '../../../hooks/useRequest';
import PassUI from '../../../lib/core/ui.proxy';
import { intoCustomMonitorAddress } from '../../../lib/monitor/monitor.utils';
import { addCustomAddress } from '../../../store/actions';
import { prop } from '../../../utils/fp/lens';
import { pipe } from '../../../utils/fp/pipe';
import { toLowerCase } from '../../../utils/string/to-lower-case';
import { getEpoch } from '../../../utils/time/epoch';
import { Field } from '../../Form/Field/Field';
import { FieldsetCluster } from '../../Form/Field/Layout/FieldsetCluster';
import { TextField } from '../../Form/Field/TextField';
import { SidebarModal } from '../../Layout/Modal/SidebarModal';
import { Panel } from '../../Layout/Panel/Panel';
import { PanelHeader } from '../../Layout/Panel/PanelHeader';
import { useMonitor } from '../MonitorContext';

export const FORM_ID = 'custom-address-add';
type Props = { onClose: () => void };
type FormValues = { email: string };

export const CustomAddressAddModal: FC<Props> = ({ onClose }) => {
    const { verifyAddress } = useMonitor();

    const { loading, dispatch } = useRequest(addCustomAddress, {
        onSuccess: (address) => verifyAddress(intoCustomMonitorAddress(address), getEpoch()),
    });

    const form = useFormik<FormValues>({
        initialValues: { email: '' },
        validateOnChange: true,
        validateOnMount: false,
        validate: async ({ email }) => {
            const errors: FormikErrors<FormValues> = {};
            if (!email) errors.email = c('Warning').t`Email is required`;
            else if (!(await PassUI.is_email_valid(email))) errors.email = c('Warning').t`Invalid email`;
            return errors;
        },
        onSubmit: pipe(prop('email'), toLowerCase, dispatch),
    });

    return (
        <SidebarModal onClose={onClose} open>
            {(didEnter) => (
                <Panel
                    loading={loading}
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
                    <h2 className="text-xl text-bold mb-3">{c('Title').t`Custom email monitoring`}</h2>
                    <p>{c('Info').t`Add your custom email address to monitor:`}</p>
                    <FormikProvider value={form}>
                        <Form id={FORM_ID} className="mb-4">
                            <FieldsetCluster>
                                <Field
                                    name="email"
                                    component={TextField}
                                    label={c('Label').t`Email`}
                                    placeholder={c('Placeholder').t`me@example.com`}
                                    autoFocus={didEnter}
                                    key={`custom-address-add-${didEnter}`}
                                />
                            </FieldsetCluster>
                        </Form>
                    </FormikProvider>
                </Panel>
            )}
        </SidebarModal>
    );
};
