import { type FC } from 'react';
import { useDispatch } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { bootIntent } from '@proton/pass/store/actions';

import { Field } from '../Form/Field/Field';
import { PasswordField } from '../Form/legacy/PasswordField';

export const OfflineUnlock: FC = () => {
    const dispatch = useDispatch();

    const form = useFormik({
        initialValues: { password: '' },
        validateOnBlur: true,
        validate: (values) =>
            values.password.length > 0 ? {} : { password: c('Warning').t`Encryption password is required` },
        onSubmit: ({ password }) => {
            dispatch(bootIntent(password));
        },
    });

    return (
        <FormikProvider value={form}>
            <Form id="offline-unlock">
                <div className="flex flex-nowrap items-end w-full" style={{ '--border-radius-xl': '2em' }}>
                    <Field
                        component={PasswordField}
                        name="password"
                        dense
                        rootClassName="flex-1"
                        className="flex-1 rounded-xl overflow-hidden"
                        inputClassName="text-rg rounded-none"
                    />
                </div>
                <Button pill shape="solid" color="norm" className="w-full" type="submit">
                    {c('Action').t`Continue`}
                </Button>
            </Form>
        </FormikProvider>
    );
};
