import { type FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { RadioGroup, useNotifications } from '@proton/components';
import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { LockTTLField } from '@proton/pass/components/Lock/LockTTLField';
import { usePasswordUnlock } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { usePinUnlock } from '@proton/pass/components/Lock/PinUnlockProvider';
import { useUnlock } from '@proton/pass/components/Lock/UnlockProvider';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { EXTENSION_BUILD } from '@proton/pass/lib/client';
import { lockCreateIntent } from '@proton/pass/store/actions';
import { lockCreateRequest } from '@proton/pass/store/actions/requests';
import { selectLockMode, selectLockTTL, selectUserSettings } from '@proton/pass/store/selectors';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import { SETTINGS_PASSWORD_MODE } from '@proton/shared/lib/interfaces';

import { SettingsPanel } from './SettingsPanel';

export const LockSettings: FC = () => {
    const confirmPin = usePinUnlock();
    const confirmPassword = usePasswordUnlock();
    const authStore = useAuthStore();
    const { createNotification } = useNotifications();

    const pwdMode = useSelector(selectUserSettings)?.Password?.Mode;
    const lockTTL = useSelector(selectLockTTL);
    const lockMode = useSelector(selectLockMode);
    const twoPwdMode = pwdMode === SETTINGS_PASSWORD_MODE.TWO_PASSWORD_MODE;
    const hasOfflinePassword = authStore?.hasOfflinePassword() ?? false;
    const canPasswordLock = !EXTENSION_BUILD && (!twoPwdMode || hasOfflinePassword);
    const canToggleTTL = lockMode !== LockMode.NONE;

    /** When switching locks, the next lock might temporarily
     * be set to `LockMode.NONE` before updating to the new lock.
     * This temporary state change can cause flickering. To avoid
     * this, we use an optimistic value for the next lock. */
    const [nextLock, setNextLock] = useState<MaybeNull<{ ttl: number; mode: LockMode }>>(null);

    const unlock = useUnlock((err) => createNotification({ type: 'error', text: err.message }));

    const createLock = useActionRequest(lockCreateIntent, {
        initialRequestId: lockCreateRequest(),
        onStart: ({ data }) => setNextLock({ ttl: data.lock.ttl, mode: data.lock.mode }),
        onFailure: () => setNextLock(null),
        onSuccess: () => setNextLock(null),
    });

    const handleLockModeSwitch = async (mode: LockMode) => {
        const ttl = lockTTL ?? 900;
        /** If the current lock mode is a session lock - always
         * ask for the current PIN in order to delete the lock */
        const current = await new Promise<Maybe<{ secret: string }>>(async (resolve) => {
            switch (lockMode) {
                case LockMode.SESSION:
                    return confirmPin({
                        title: c('Title').t`Confirm PIN code`,
                        assistiveText: c('Info')
                            .t`Please confirm your PIN code in order to unregister your current lock.`,
                        onSubmit: async (secret) => {
                            await unlock({ mode: lockMode, secret });
                            resolve({ secret });
                        },
                    });
                case LockMode.PASSWORD:
                    return confirmPassword({
                        onSubmit: async (secret) => {
                            await unlock({ mode: lockMode, secret });
                            resolve({ secret });
                        },
                        message: c('Info')
                            .t`Please confirm your ${BRAND_NAME} password in order to unregister your current lock.`,
                    });

                default:
                    return resolve(undefined);
            }
        });

        switch (mode) {
            case LockMode.SESSION:
                return confirmPin({
                    title: c('Title').t`Create PIN code`,
                    assistiveText: c('Info')
                        .t`You will use this PIN to unlock ${PASS_APP_NAME} once it auto-locks after a period of inactivity.`,
                    onSubmit: (secret) =>
                        confirmPin({
                            title: c('Title').t`Confirm PIN code`,
                            assistiveText: c('Info')
                                .t`Please confirm your PIN code in order to unregister your current lock.`,
                            onSubmit: (confirmed) => {
                                if (confirmed === secret) createLock.dispatch({ mode, secret, ttl });
                                else createNotification({ type: 'error', text: c('Error').t`PIN codes do not match` });
                            },
                        }),
                });

            case LockMode.PASSWORD:
                return confirmPassword({
                    onSubmit: (secret) => createLock.dispatch({ mode, secret, ttl, current }),
                    message: c('Info')
                        .t`Please confirm your ${BRAND_NAME} password in order to auto-lock with your password.`,
                });

            case LockMode.NONE:
                return createLock.dispatch({ mode, secret: '', ttl, current });
        }
    };

    const handleLockTTLChange = async (ttl: number) => {
        switch (lockMode) {
            case LockMode.SESSION:
                return confirmPin({
                    onSubmit: (secret) => createLock.dispatch({ mode: lockMode, secret, ttl, current: { secret } }),
                    title: c('Title').t`Auto-lock update`,
                    assistiveText: c('Info').t`Please confirm your PIN code to edit this setting.`,
                });
            case LockMode.PASSWORD:
                return confirmPassword({
                    onSubmit: (secret) => createLock.dispatch({ mode: lockMode, secret, ttl }),
                    message: c('Info')
                        .t`Please confirm your ${BRAND_NAME} password in order to update the auto-lock time.`,
                });
        }
    };

    useEffect(() => {
        /** Block reload/navigation if a lock request is on-going.
         * Custom `beforeunload` messages are now deprecated */
        const onBeforeUnload = (evt: BeforeUnloadEvent) => {
            if (createLock.loading) {
                evt.preventDefault();
                evt.returnValue = '';
                return '';
            }
        };

        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [createLock.loading]);

    return (
        <SettingsPanel title={c('Label').t`Session locking`}>
            <RadioGroup<LockMode>
                name="lock-mode"
                onChange={handleLockModeSwitch}
                value={nextLock?.mode ?? lockMode}
                className="flex-nowrap gap-3"
                disableChange={createLock.loading}
                options={[
                    {
                        label: (
                            <span className="block">
                                {c('Label').t`None`}
                                <span className="block color-weak text-sm">{c('Info')
                                    .t`${PASS_APP_NAME} will always be accessible`}</span>
                            </span>
                        ),
                        value: LockMode.NONE,
                    },
                    {
                        label: (
                            <span className="block">
                                {c('Label').t`PIN code`}
                                <span className="block color-weak text-sm">{c('Info')
                                    .t`Online access to ${PASS_APP_NAME} will require a PIN code to unlock your session. You'll be logged out after 3 failed attempts.`}</span>
                            </span>
                        ),
                        value: LockMode.SESSION,
                    },
                    ...(canPasswordLock
                        ? [
                              {
                                  label: (
                                      <span className="block">
                                          {c('Label').t`Password`}
                                          <span className="block color-weak text-sm">{c('Info')
                                              .t`Access to ${PASS_APP_NAME} will always require your ${BRAND_NAME} password.`}</span>
                                      </span>
                                  ),
                                  value: LockMode.PASSWORD,
                              },
                          ]
                        : []),
                ]}
            />

            <hr className="mt-2 mb-4 border-weak shrink-0" />

            <LockTTLField
                ttl={nextLock?.ttl ?? lockTTL}
                disabled={!canToggleTTL || createLock.loading}
                onChange={handleLockTTLChange}
            />
        </SettingsPanel>
    );
};
