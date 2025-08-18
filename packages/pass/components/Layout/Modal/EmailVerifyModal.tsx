import { type FC, type ReactNode } from 'react';

import { Form, type FormikErrors, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Collapsible, CollapsibleContent, CollapsibleHeader, Icon } from '@proton/components';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import type { Maybe } from '@proton/pass/types';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { isNumber } from '@proton/shared/lib/helpers/validators';

const FORM_ID = 'email-verify';

export const SECONDS_BEFORE_RESEND = 60;

export const getInitialCountdown = (sentAt?: number): Maybe<number> => {
    const now = getEpoch();
    if (!sentAt || now - sentAt >= SECONDS_BEFORE_RESEND) return;
    return Math.max(0, SECONDS_BEFORE_RESEND - (now - sentAt));
};

type Props = {
    email: string;
    onClose: () => void;
    onResend: () => void;
    onSubmit: (code: string) => void;
    remaining: number;
    resendLoading: boolean;
    sentAt?: number;
    submitLoading: boolean;
};

type FormValues = { code: string };

export const EmailVerifyModal: FC<Props> = ({
    email,
    onClose,
    onResend,
    onSubmit,
    remaining,
    resendLoading,
    submitLoading,
}) => {
    const form = useFormik<FormValues>({
        initialValues: { code: '' },
        validateOnChange: true,
        validateOnMount: false,
        validate: ({ code }) => {
            const errors: FormikErrors<FormValues> = {};
            if (!code) errors.code = c('Warning').t`Verification code is required`;
            if (!isNumber(code)) errors.code = c('Warning').t`Invalid code`;
            return errors;
        },
        onSubmit: ({ code }) => {
            onSubmit(code);
        },
    });

    return (
        <SidebarModal onClose={onClose} open>
            {(didEnter): ReactNode => (
                <Panel
                    loading={submitLoading}
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
                                    disabled={submitLoading || !form.isValid}
                                    form={FORM_ID}
                                    key="modal-submit-button"
                                    loading={submitLoading}
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
                                    dense
                                    key={`custom-address-verify-${didEnter}`}
                                />
                            </FieldsetCluster>
                        </Form>
                    </FormikProvider>

                    <div className="mt-2">
                        <Collapsible>
                            <CollapsibleHeader>
                                <Button color="norm" size="small" shape="underline">
                                    {c('Info').t`Didn't receive the code?`}
                                </Button>
                            </CollapsibleHeader>
                            <CollapsibleContent className="text-sm py-2">
                                <span className="color-weak">
                                    {c('Info').t`Please check your spam folder or try resending the code.`}
                                </span>
                                <Button
                                    color="norm"
                                    size="small"
                                    disabled={resendLoading || remaining > 0}
                                    loading={resendLoading}
                                    onClick={onResend}
                                    shape="underline"
                                    className="block"
                                >
                                    {remaining > 0
                                        ? // translator: example usage: Resend code (in 30s)
                                          c('Action').t`Resend code (in ${remaining}s)`
                                        : c('Action').t`Resend code`}
                                </Button>
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                </Panel>
            )}
        </SidebarModal>
    );
};
