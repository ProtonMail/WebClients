import type { FC } from 'react';

import { Form, type FormikErrors, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { useMonitor } from '@proton/pass/components/Monitor/MonitorContext';
import { useRequest } from '@proton/pass/hooks/useRequest';
import PassUI from '@proton/pass/lib/core/ui.proxy';
import { intoCustomMonitorAddress } from '@proton/pass/lib/monitor/monitor.utils';
import { addCustomAddress } from '@proton/pass/store/actions';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { toLowerCase } from '@proton/pass/utils/string/to-lower-case';
import { getEpoch } from '@proton/pass/utils/time/epoch';

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
