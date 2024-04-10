import { type FC } from 'react';
import { useHistory } from 'react-router-dom';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { PasswordField } from '@proton/pass/components/Form/legacy/PasswordField';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { authStore } from '@proton/pass/lib/auth/store';
import { unlock } from '@proton/pass/store/actions';
import { unlockRequest } from '@proton/pass/store/actions/requests';
import { getBasename } from '@proton/shared/lib/authentication/pathnameHelper';

export const PasswordUnlock: FC = () => {
    const history = useHistory();
    const passwordUnlock = useRequest(unlock, { initialRequestId: unlockRequest() });

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
            passwordUnlock.dispatch({ mode: LockMode.PASSWORD, secret: password });
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
                        disabled={passwordUnlock.loading}
                    />
                </div>
                <Button
                    pill
                    shape="solid"
                    color="norm"
                    className="w-full"
                    type="submit"
                    loading={passwordUnlock.loading}
                >
                    {c('Action').t`Continue`}
                </Button>
            </Form>
        </FormikProvider>
    );
};
