import { type FC } from 'react';

import { Form, type FormikErrors, FormikProvider, useFormik } from 'formik';

import { Button } from '@proton/atoms';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { PasswordField } from '@proton/pass/components/Form/legacy/PasswordField';
import { type PasswordCredentials } from '@proton/pass/lib/auth/password';

type Props = {
    id: string;
    disabled?: boolean;
    loading?: boolean;
    submitLabel?: string;
    onSubmit: (values: PasswordCredentials) => void;
    onValidate?: (values: PasswordCredentials) => FormikErrors<PasswordCredentials>;
};

export const PasswordForm: FC<Props> = ({ id, disabled, loading, submitLabel, onSubmit, onValidate }) => {
    const form = useFormik({
        initialValues: { password: '' },
        validateOnMount: true,
        validateOnBlur: true,
        validate: onValidate,
        onSubmit,
    });

    return (
        <FormikProvider value={form}>
            <Form id={id}>
                <div className="flex flex-nowrap items-end w-full" style={{ '--border-radius-xl': '2em' }}>
                    <Field
                        component={PasswordField}
                        name="password"
                        dense
                        rootClassName="flex-1"
                        className="flex-1 rounded-xl overflow-hidden"
                        inputClassName="text-rg rounded-none"
                        disabled={disabled || loading}
                        autoFocus={!disabled}
                        {...(disabled ? { error: undefined } : {})}
                    />
                </div>
                <Button
                    pill
                    shape="solid"
                    color="norm"
                    className="w-full"
                    type="submit"
                    loading={loading}
                    disabled={!form.isValid || disabled}
                >
                    {submitLabel}
                </Button>
            </Form>
        </FormikProvider>
    );
};
