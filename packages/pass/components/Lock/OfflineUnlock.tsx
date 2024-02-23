import { type FC } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { authStore } from '@proton/pass/lib/auth/store';
import { bootIntent } from '@proton/pass/store/actions';
import { getBasename } from '@proton/shared/lib/authentication/pathnameHelper';

import { Field } from '../Form/Field/Field';
import { PasswordField } from '../Form/legacy/PasswordField';

export const OfflineUnlock: FC = () => {
    const dispatch = useDispatch();
    const history = useHistory();

    const form = useFormik({
        initialValues: { password: '' },
        validateOnBlur: true,
        validate: (values) =>
            values.password.length > 0 ? {} : { password: c('Warning').t`Encryption password is required` },
        onSubmit: ({ password }) => {
            /** As booting offline will not trigger the AuthService::login
             * sequence we need to re-apply the redirection logic implemented
             * in the service's `onAuthorized` callback */
            const localID = authStore.getLocalID();
            history.replace(getBasename(localID) ?? '/');
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
