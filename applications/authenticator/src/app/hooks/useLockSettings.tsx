import { useEffect, useState } from 'react';

import { usePasswordUnlock } from 'proton-authenticator/app/providers/PasswordUnlockProvider';
import biometrics from 'proton-authenticator/lib/locks/biometrics';
import type { AppLock } from 'proton-authenticator/lib/locks/types';
import { verifyUnlock } from 'proton-authenticator/store/lock';
import { updateLock } from 'proton-authenticator/store/settings';
import { useAppDispatch, useAppSelector } from 'proton-authenticator/store/utils';
import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import useNotifications from '@proton/components/hooks/useNotifications';
import { AUTHENTICATOR_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

export const useLockSettings = () => {
    const dispatch = useAppDispatch();
    const { createNotification } = useNotifications();
    const { appLock, backupDirectory } = useAppSelector((s) => s.settings);
    const [biometricsEnabled, setBiometricsEnabled] = useState<Boolean>(appLock === 'biometrics');

    const confirmPassword = usePasswordUnlock();

    useEffect(() => {
        (async () => {
            if (appLock !== 'biometrics') {
                const enabled = await biometrics.check();
                setBiometricsEnabled(enabled);
            }
        })().catch(noop);
    }, [appLock]);

    const passwordDescription = (
        <>
            <div className="mb-4">
                {c('authenticator-2025:Description')
                    .t`You will need this password to unlock ${AUTHENTICATOR_APP_NAME} every time it restarts.`}
            </div>
            <div className="flex flex-nowrap gap-2 items-center">
                <Icon name="exclamation-circle" className="color-danger shrink-0" />
                <div>
                    <span>{c('authenticator-2025:Warning').t`Your data will be erased after 10 failed attempts.`}</span>
                    {Boolean(backupDirectory) && (
                        <span> {c('authenticator-2025:Info').t`Backup files will not be erased.`}</span>
                    )}
                </div>
            </div>
        </>
    );

    const setLockMode = async (mode: AppLock) => {
        /** If a current lock mode is already set (different from 'none'),
         * ask to confirm current mode before setting the new mode. */
        const confirmationValid = await new Promise<boolean>(async (resolve) => {
            switch (appLock) {
                case 'password':
                    await confirmPassword({
                        title: c('Title').t`Confirm password`,
                        onSubmit: async (password) => {
                            const res = await dispatch(verifyUnlock({ mode: appLock, password }));
                            resolve(res.meta.requestStatus === 'fulfilled');
                        },
                    });
                    break;
                case 'biometrics': {
                    const res = await dispatch(verifyUnlock({ mode: appLock }));
                    resolve(res.meta.requestStatus === 'fulfilled');
                }
                default:
                    return resolve(true);
            }
        });

        if (!confirmationValid) return;

        switch (mode) {
            case 'password':
                return confirmPassword({
                    title: c('authenticator-2025:Title').t`Create password`,
                    message: passwordDescription,
                    submitLabel: c('Action').t`Create`,
                    onSubmit: (password) =>
                        confirmPassword({
                            title: c('authenticator-2025:Title').t`Confirm password`,
                            message: passwordDescription,
                            onSubmit: async (confirmationPassword) => {
                                if (confirmationPassword === password) {
                                    return dispatch(updateLock({ mode: 'password', password }));
                                } else {
                                    createNotification({
                                        type: 'error',
                                        text: c('authenticator-2025:Error').t`Passwords do not match`,
                                    });
                                }
                            },
                        }),
                });
            default:
                return dispatch(updateLock({ mode }));
        }
    };

    return {
        appLock,
        biometricsEnabled,
        setLockMode,
    };
};
