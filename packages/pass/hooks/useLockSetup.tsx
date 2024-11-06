import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';
import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { usePasswordUnlock } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { usePinUnlock } from '@proton/pass/components/Lock/PinUnlockProvider';
import { useUnlock } from '@proton/pass/components/Lock/UnlockProvider';
import { useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { DEFAULT_LOCK_TTL, UpsellRef } from '@proton/pass/constants';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { lockCreateIntent } from '@proton/pass/store/actions';
import { lockCreateRequest } from '@proton/pass/store/actions/requests';
import {
    selectExtraPasswordEnabled,
    selectLockMode,
    selectLockTTL,
    selectPassPlan,
    selectUserSettings,
} from '@proton/pass/store/selectors';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { SETTINGS_PASSWORD_MODE } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

type LockState = {
    /** If `true`, user should not be able to toggle the TTL */
    orgControlled: boolean;
    /** Loading state for any ongoing lock mutation */
    loading: boolean;
    /** Current lock mode (Accounts for optimistic updates) */
    mode: LockMode;
    /** TTL Value is disabled when `orgControlled` or `LockMode.NONE` */
    ttl: { value: Maybe<number>; disabled: boolean };
};

type BiometricsState = {
    /** `true` if biometric already setup or on successful `canCheckPresence` */
    enabled: boolean;
    /** Biometrics is a paid only feature (disabled for free users) */
    needsUpgrade: boolean;
};

type PasswordState = {
    /** Password lock can be enabled if the user is not in two
     * password mode OR if he has a valid offline password. */
    enabled: boolean;
};

interface LockSetup {
    lock: LockState;
    biometrics: BiometricsState;
    password: PasswordState;
    setLockMode: (mode: LockMode) => Promise<void>;
    setLockTTL: (ttl: number) => Promise<void>;
}

export const useLockSetup = (): LockSetup => {
    const { getBiometricsKey } = usePassCore();
    const { createNotification } = useNotifications();

    const confirmPin = usePinUnlock();
    const confirmPassword = usePasswordUnlock();
    const spotlight = useSpotlight();
    const authStore = useAuthStore();

    const org = useOrganization({ sync: true });
    const orgLockTTL = org?.settings.ForceLockSeconds;

    const currentLockMode = useSelector(selectLockMode);
    const hasExtraPassword = useSelector(selectExtraPasswordEnabled);
    const lockTTL = useSelector(selectLockTTL);
    const pwdMode = useSelector(selectUserSettings)?.Password?.Mode;
    const plan = useSelector(selectPassPlan);
    const isFreePlan = !isPaidPlan(plan);

    /** When switching locks, the next lock might temporarily
     * be set to `LockMode.NONE` before updating to the new lock.
     * This temporary state change can cause flickering. To avoid
     * this, we use an optimistic value for the next lock. */
    const [nextLock, setNextLock] = useState<MaybeNull<{ ttl: number; mode: LockMode }>>(null);
    const [biometricsEnabled, setBiometricsEnabled] = useState(currentLockMode === LockMode.BIOMETRICS);

    const unlock = useUnlock((err) => createNotification({ type: 'error', text: err.message }));

    const createLock = useActionRequest(lockCreateIntent, {
        initialRequestId: lockCreateRequest(),
        onStart: ({ data }) => setNextLock({ ttl: data.lock.ttl, mode: data.lock.mode }),
        onFailure: () => setNextLock(null),
        onSuccess: () => setNextLock(null),
    });

    const setLockMode = async (mode: LockMode) => {
        if (isFreePlan && mode === LockMode.BIOMETRICS) {
            return spotlight.setUpselling({
                type: 'pass-plus',
                upsellRef: UpsellRef.PASS_BIOMETRICS,
            });
        }

        const ttl = orgLockTTL || (lockTTL ?? DEFAULT_LOCK_TTL);
        /** If the current lock mode is a session lock - always
         * ask for the current PIN in order to delete the lock */
        const current = await new Promise<Maybe<{ secret: string }>>(async (resolve) => {
            switch (currentLockMode) {
                case LockMode.SESSION:
                    return confirmPin({
                        title: c('Title').t`Confirm PIN code`,
                        assistiveText: c('Info')
                            .t`Please confirm your PIN code in order to unregister your current lock.`,
                        onSubmit: async (secret) => {
                            await unlock({ mode: currentLockMode, secret });
                            resolve({ secret });
                        },
                    });

                case LockMode.BIOMETRICS: {
                    /** Confirm the biometric key before proceeding */
                    const secret = (await getBiometricsKey?.(authStore!).catch(noop)) ?? '';
                    return unlock({ mode: currentLockMode, secret })
                        .then(() => resolve({ secret }))
                        .catch(() => resolve(undefined));
                }

                case LockMode.PASSWORD:
                    return confirmPassword({
                        message: (() => {
                            switch (mode) {
                                /** If the next mode is `BIOMETRIC` then we'll feed the result of this
                                 *  first unlock call to the `BIOMETRIC` lock creation */
                                case LockMode.BIOMETRICS:
                                    return hasExtraPassword
                                        ? c('Info')
                                              .t`Please confirm your extra password in order to auto-lock with biometrics.`
                                        : c('Info')
                                              .t`Please confirm your password in order to auto-lock with biometrics.`;
                                default:
                                    return hasExtraPassword
                                        ? c('Info')
                                              .t`Please confirm your extra password in order to unregister your current lock.`
                                        : c('Info')
                                              .t`Please confirm your password in order to unregister your current lock.`;
                            }
                        })(),
                        onSubmit: async (secret) => {
                            await unlock({ mode: currentLockMode, secret });
                            resolve({ secret });
                        },
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
                                .t`You will use this PIN to unlock ${PASS_APP_NAME} once it auto-locks after a period of inactivity.`,
                            onSubmit: (confirmed) => {
                                if (confirmed === secret) createLock.dispatch({ mode, secret, ttl });
                                else createNotification({ type: 'error', text: c('Error').t`PIN codes do not match` });
                            },
                        }),
                });

            case LockMode.PASSWORD:
                return confirmPassword({
                    onSubmit: (secret) => createLock.dispatch({ mode, secret, ttl, current }),
                    message: hasExtraPassword
                        ? c('Info')
                              .t`Please confirm your extra password in order to auto-lock with your extra password.`
                        : c('Info').t`Please confirm your password in order to auto-lock with your password.`,
                });

            case LockMode.BIOMETRICS: {
                if (currentLockMode === LockMode.PASSWORD) {
                    /** if unregistered password lock then we have the secret already */
                    return createLock.dispatch({ mode, secret: current?.secret ?? '', ttl });
                }

                /* else prompt for password */
                return confirmPassword({
                    onSubmit: (secret) => createLock.dispatch({ mode, secret, ttl, current }),
                    message: hasExtraPassword
                        ? c('Info').t`Please confirm your extra password in order to auto-lock with biometrics.`
                        : c('Info').t`Please confirm your password in order to auto-lock with biometrics.`,
                });
            }

            case LockMode.NONE:
                return createLock.dispatch({ mode, secret: '', ttl, current });
        }
    };

    const setLockTTL = async (ttl: number) => {
        switch (currentLockMode) {
            case LockMode.SESSION:
                return confirmPin({
                    onSubmit: (secret) =>
                        createLock.dispatch({ mode: currentLockMode, secret, ttl, current: { secret } }),
                    title: c('Title').t`Auto-lock update`,
                    assistiveText: c('Info').t`Please confirm your PIN code to edit this setting.`,
                });

            case LockMode.PASSWORD:
            case LockMode.BIOMETRICS:
                return confirmPassword({
                    onSubmit: (secret) => createLock.dispatch({ mode: currentLockMode, secret, ttl }),
                    message: hasExtraPassword
                        ? c('Info').t`Please confirm your extra password in order to update the auto-lock time.`
                        : c('Info').t`Please confirm your password in order to update the auto-lock time.`,
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

    useEffect(() => {
        (async () => {
            if (!DESKTOP_BUILD || currentLockMode === LockMode.BIOMETRICS) return;
            const canCheckPresence = (await window.ctxBridge?.canCheckPresence?.()) ?? false;
            setBiometricsEnabled(canCheckPresence);
        })().catch(noop);
    }, [currentLockMode]);

    const lock = useMemo(
        () => ({
            orgControlled: Boolean(orgLockTTL),
            loading: createLock.loading,
            mode: nextLock?.mode ?? currentLockMode,
            ttl: {
                value: nextLock?.ttl || orgLockTTL || lockTTL,
                disabled: Boolean(currentLockMode === LockMode.NONE || orgLockTTL),
            },
        }),
        [currentLockMode, nextLock, orgLockTTL, lockTTL, createLock.loading]
    );

    const biometrics = useMemo(
        () => ({ enabled: biometricsEnabled, needsUpgrade: isFreePlan }),
        [biometricsEnabled, isFreePlan]
    );

    const password = useMemo(
        () => ({
            enabled:
                !EXTENSION_BUILD &&
                (pwdMode !== SETTINGS_PASSWORD_MODE.TWO_PASSWORD_MODE || (authStore?.hasOfflinePassword() ?? false)),
        }),
        [pwdMode]
    );

    return {
        lock,
        biometrics,
        password,
        setLockMode,
        setLockTTL,
    };
};
