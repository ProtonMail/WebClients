import { type FC, useEffect, useState } from 'react';

import { Field, Form, FormikProvider, useFormik } from 'formik';
import iconGray from 'proton-authenticator/assets/authenticator_icon_gray.png';
import type { AppLock } from 'proton-authenticator/lib/locks/types';
import { LOCK_MAX_FAILURES, getFailedAttemptCount } from 'proton-authenticator/lib/locks/utils';
import { unlock } from 'proton-authenticator/store/lock';
import { useAppDispatch, useAppSelector } from 'proton-authenticator/store/utils';
import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { PasswordField } from '@proton/pass/components/Form/legacy/PasswordField';
import { prop } from '@proton/pass/utils/fp/lens';
import { AUTHENTICATOR_APP_NAME } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';

type Props = { lockMode: AppLock };

type UnlockFailure = {
    count: number;
    /** True if last failed attempt was from this session.
     *  False if it was from a previous session and user closed the app. */
    failedInCurrentSession: boolean;
};
export const UnlockScreen: FC<Props> = ({ lockMode }) => {
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(false);
    const { appLock } = useAppSelector(prop('settings'));

    const [failedState, setFailedState] = useState<UnlockFailure>(() => ({
        count: getFailedAttemptCount() ?? 0,
        failedInCurrentSession: false,
    }));

    const remainingCount = LOCK_MAX_FAILURES - failedState.count;

    const form = useFormik({
        initialValues: { password: '' },
        onSubmit: async ({ password }) => {
            if (!loading) {
                setLoading(true);

                await dispatch(unlock({ mode: lockMode, password })).then(() => {
                    form.resetForm();
                    setLoading(false);
                });

                await wait(100).then(() =>
                    setFailedState(({ count }) => ({
                        count: count + 1,
                        failedInCurrentSession: true,
                    }))
                );
            }
        },
    });

    useEffect(() => {
        if (appLock === 'biometrics' && document.hasFocus()) {
            void dispatch(unlock({ mode: 'biometrics' }));
        }
    }, []);

    return (
        <div className="w-full h-full flex justify-center items-center">
            <div className="flex flex-column items-center gap-6">
                <img src={iconGray} alt="" width={64} height={64} />

                <span className="h2 w-full text-center text-bold">
                    {c('authenticator-2025:Title').t`Unlock ${AUTHENTICATOR_APP_NAME}`}
                </span>

                {(() => {
                    switch (lockMode) {
                        case 'password':
                            return (
                                <FormikProvider value={form}>
                                    <Form
                                        id="app-password-unlock"
                                        className="flex flex-column items-center w-full gap-3 w-custom"
                                        style={{ '--w-custom': '22rem' }}
                                    >
                                        <div className="flex justify-center items-center gap-1 text-center">
                                            {!failedState.failedInCurrentSession && (
                                                <span className="text-lg">{c('authenticator-2025:Label')
                                                    .t`Enter your password:`}</span>
                                            )}
                                            {failedState.count > 0 && failedState.failedInCurrentSession && (
                                                <strong className="color-danger text-lg">
                                                    {c('authenticator-2025:Warning')
                                                        .t`You have entered a wrong password.`}
                                                </strong>
                                            )}
                                            {failedState.count > 0 && (
                                                <span className="color-danger text-sm">
                                                    {c('authenticator-2025:Warning').ngettext(
                                                        msgid`You have ${remainingCount} attempt left - after that, your data will be erased.`,
                                                        `You have ${remainingCount} attempts left - after that, your data will be erased.`,
                                                        remainingCount
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        <Field
                                            autoComplete="current-password"
                                            autoFocus
                                            className="flex-1 overflow-hidden"
                                            component={PasswordField}
                                            dense
                                            inputClassName="text-rg rounded-none"
                                            name="password"
                                            required
                                            rootClassName="flex-1"
                                            bigger
                                        />

                                        <Button
                                            pill
                                            size="large"
                                            shape="solid"
                                            color="norm"
                                            className="w-full cta-button"
                                            type="submit"
                                            loading={loading}
                                            disabled={!form.isValid}
                                        >
                                            {c('authenticator-2025:Action').t`Unlock`}
                                        </Button>
                                    </Form>
                                </FormikProvider>
                            );
                        case 'biometrics':
                            return (
                                <Button
                                    size="large"
                                    shape="solid"
                                    color="norm"
                                    className="w-full cta-button mt-2"
                                    onClick={() => dispatch(unlock({ mode: 'biometrics' }))}
                                >
                                    <Icon className="mr-2" name="fingerprint" />
                                    <span>{c('authenticator-2025:Action').t`Unlock with biometrics`}</span>
                                </Button>
                            );
                    }
                })()}
            </div>
        </div>
    );
};
