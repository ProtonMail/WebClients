import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { usePasswordTypeSwitch, usePasswordUnlock } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { usePinUnlock } from '@proton/pass/components/Lock/PinUnlockProvider';
import { useUnlock } from '@proton/pass/components/Lock/UnlockProvider';
import { useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
import { DEFAULT_LOCK_TTL, UpsellRef } from '@proton/pass/constants';
import { useDesktopUnlock } from '@proton/pass/hooks/auth/useDesktopUnlock';
import { useActionRequest } from '@proton/pass/hooks/useRequest';
import type { UnlockDTO } from '@proton/pass/lib/auth/lock/types';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { ReauthAction } from '@proton/pass/lib/auth/reauth';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { lockCreateIntent } from '@proton/pass/store/actions';
import { lockCreateRequest } from '@proton/pass/store/actions/requests';
import { selectLockMode, selectLockTTL, selectPassPlan } from '@proton/pass/store/selectors';
import type { Maybe, MaybeNull, Result } from '@proton/pass/types';
import { cloneObfuscation } from '@proton/pass/utils/obfuscate/xor';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
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
    const { getBiometricsKey, supportsBiometrics } = usePassCore();
    const { createNotification } = useNotifications();

    const confirmPin = usePinUnlock();
    const confirmPassword = usePasswordUnlock();
    const confirmDesktop = useDesktopUnlock();
    const passwordTypeSwitch = usePasswordTypeSwitch();
    const upsell = useUpselling();
    const authStore = useAuthStore();

    const org = useOrganization({ sync: true });
    const orgLockTTL = org?.settings.ForceLockSeconds;

    const currentLockMode = useSelector(selectLockMode);
    const lockTTL = useSelector(selectLockTTL);

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
        requestId: lockCreateRequest(),
        onStart: ({ lock }) => setNextLock({ ttl: lock.ttl, mode: lock.mode }),
        onFailure: () => setNextLock(null),
        onSuccess: () => setNextLock(null),
    });

    const setLockMode = async (mode: LockMode) => {
        if (isFreePlan && mode === LockMode.BIOMETRICS) {
            return upsell({
                type: 'pass-plus',
                upsellRef: UpsellRef.PASS_BIOMETRICS,
            });
        }

        const ttl = orgLockTTL || (lockTTL ?? DEFAULT_LOCK_TTL);

        /** 1. Verify the current lock and collect the typed `UnlockDTO`.
         * Forwarded to the creation request to delete the existing lock. */
        const current = await new Promise<Result<UnlockDTO>>(async (resolve) => {
            switch (currentLockMode) {
                case LockMode.SESSION:
                    return confirmPin({
                        title: c('Title').t`Confirm PIN code`,
                        assistiveText: c('Info')
                            .t`Please confirm your PIN code in order to unregister your current lock.`,
                        onSubmit: async (pin) => {
                            const dto: UnlockDTO = { mode: LockMode.SESSION, pin, offline: false };
                            await unlock(dto);
                            resolve({ ok: true, ...dto });
                        },
                    });

                case LockMode.BIOMETRICS: {
                    const key = (await getBiometricsKey?.(authStore!).catch(noop)) ?? '';
                    if (!key) return resolve({ ok: false });
                    const dto: UnlockDTO = { mode: LockMode.BIOMETRICS, key, offline: false };

                    return unlock(dto)
                        .then(() => resolve({ ok: true, ...dto }))
                        .catch(() => resolve({ ok: false }));
                }

                case LockMode.PASSWORD: {
                    return confirmPassword({
                        message: (() => {
                            switch (mode) {
                                /** PASSWORD → BIOMETRICS: the resolved DTO carries the obfuscated
                                 * password so it can be reused in step 3 without a second prompt. */
                                case LockMode.BIOMETRICS:
                                    return passwordTypeSwitch({
                                        extra: c('Info')
                                            .t`Please confirm your extra password in order to auto-lock with biometrics.`,
                                        sso: c('Info')
                                            .t`Please confirm your backup password in order to auto-lock with biometrics.`,
                                        twoPwd: c('Info')
                                            .t`Please confirm your second password in order to auto-lock with biometrics.`,
                                        default: c('Info')
                                            .t`Please confirm your password in order to auto-lock with biometrics.`,
                                    });
                                default:
                                    return passwordTypeSwitch({
                                        extra: c('Info')
                                            .t`Please confirm your extra password in order to unregister your current lock.`,
                                        sso: c('Info')
                                            .t`Please confirm your backup password in order to unregister your current lock.`,
                                        twoPwd: c('Info')
                                            .t`Please confirm your second password in order to unregister your current lock.`,
                                        default: c('Info')
                                            .t`Please confirm your password in order to unregister your current lock.`,
                                    });
                            }
                        })(),
                        onSubmit: async (password) => {
                            /** Clone so the unlock adapter can zeroize its copy
                             * without corrupting the original carried to step 3. */
                            const dto: UnlockDTO = {
                                mode: LockMode.PASSWORD,
                                password: cloneObfuscation(password),
                                offline: false,
                            };
                            await unlock(dto);
                            resolve({ ok: true, ...dto, password });
                        },
                    });
                }

                case LockMode.DESKTOP:
                    return confirmDesktop()
                        .then((dto) => resolve({ ok: true, ...dto }))
                        .catch(() => resolve({ ok: false }));

                case LockMode.NONE:
                    return resolve({ ok: true, mode: currentLockMode });
            }
        });

        /** 2. Bail if verification failed. */
        if (!current.ok) return;

        /** 3. Create the new lock. `current` is forwarded so the saga can
         * delete the old lock as part of the same request (only for PIN). */
        switch (mode) {
            case LockMode.SESSION:
                return confirmPin({
                    title: c('Title').t`Create PIN code`,
                    assistiveText: c('Info')
                        .t`You will use this PIN to unlock ${PASS_APP_NAME} once it auto-locks after a period of inactivity.`,
                    onSubmit: (pin) =>
                        confirmPin({
                            title: c('Title').t`Confirm PIN code`,
                            assistiveText: c('Info')
                                .t`You will use this PIN to unlock ${PASS_APP_NAME} once it auto-locks after a period of inactivity.`,
                            onSubmit: (confirmed) => {
                                if (confirmed === pin) createLock.dispatch({ mode, pin, ttl, current });
                                else createNotification({ type: 'error', text: c('Error').t`PIN codes do not match` });
                            },
                        }),
                });

            case LockMode.PASSWORD:
                return confirmPassword({
                    reauth: {
                        type: ReauthAction.PW_LOCK_SETUP,
                        data: { pin: current.mode === LockMode.SESSION ? current.pin : undefined, ttl },
                        fork: { promptBypass: 'none', promptType: 'offline' },
                    },
                    onSubmit: (password) => createLock.dispatch({ mode, password, ttl, current }),
                    message: passwordTypeSwitch({
                        extra: c('Info')
                            .t`Please confirm your extra password in order to auto-lock with your extra password.`,
                        sso: c('Info').t`Please confirm your backup password in order to auto-lock with your password.`,
                        twoPwd: c('Info')
                            .t`Please confirm your second password in order to auto-lock with your password.`,
                        default: c('Info').t`Please confirm your password in order to auto-lock with your password.`,
                    }),
                });

            case LockMode.BIOMETRICS: {
                /** Password lock was just unlocked in step 1, reuse that password. */
                if (current.mode === LockMode.PASSWORD) {
                    return createLock.dispatch({ mode, password: current.password, ttl });
                }

                /** Otherwise prompt for the password. Forward the PIN if the
                 * previous lock was SESSION so the saga can delete it. */
                return confirmPassword({
                    reauth: {
                        type: ReauthAction.BIOMETRICS_SETUP,
                        data: { pin: current.mode === LockMode.SESSION ? current.pin : undefined, ttl },
                        fork: { promptBypass: 'none', promptType: 'offline' },
                    },
                    onSubmit: (password) => createLock.dispatch({ current, mode, password, ttl }),
                    message: passwordTypeSwitch({
                        extra: c('Info').t`Please confirm your extra password in order to auto-lock with biometrics.`,
                        sso: c('Info').t`Please confirm your backup password in order to auto-lock with biometrics.`,
                        twoPwd: c('Info').t`Please confirm your second password in order to auto-lock with biometrics.`,
                        default: c('Info').t`Please confirm your password in order to auto-lock with biometrics.`,
                    }),
                });
            }

            case LockMode.DESKTOP:
                /** FIXME: for offline support using `LockMode.DESKTOP` we should
                 * go through the same password confirm flow as `LockMode.BIOMETRICS` */
                return createLock.dispatch({ mode, secret: '', ttl, current });

            case LockMode.NONE:
                return createLock.dispatch({ mode, ttl, current });
        }
    };

    /** Re-verification is required to update the TTL since the saga recreates
     * the lock. The confirmed secret is forwarded as `current` in each case. */
    const setLockTTL = async (ttl: number) => {
        switch (currentLockMode) {
            case LockMode.SESSION:
                return confirmPin({
                    title: c('Title').t`Auto-lock update`,
                    assistiveText: c('Info').t`Please confirm your PIN code to edit this setting.`,
                    onSubmit: (pin) =>
                        createLock.dispatch({
                            mode: currentLockMode,
                            pin,
                            ttl,
                            current: { pin, mode: LockMode.SESSION },
                        }),
                });

            /** Biometric key not needed since the mode is not changing. */
            case LockMode.PASSWORD:
            case LockMode.BIOMETRICS:
                return confirmPassword({
                    onSubmit: (password) => createLock.dispatch({ mode: currentLockMode, password, ttl }),
                    message: passwordTypeSwitch({
                        extra: c('Info').t`Please confirm your extra password in order to update the auto-lock time.`,
                        sso: c('Info').t`Please confirm your backup password in order to update the auto-lock time.`,
                        twoPwd: c('Info').t`Please confirm your second password in order to update the auto-lock time.`,
                        default: c('Info').t`Please confirm your password in order to update the auto-lock time.`,
                    }),
                });

            case LockMode.DESKTOP:
                await confirmDesktop()
                    .then(() => createLock.dispatch({ mode: currentLockMode, secret: '', ttl }))
                    .catch(noop);
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
            if (currentLockMode === LockMode.BIOMETRICS) return;
            const canCheckPresence = (await supportsBiometrics?.()) ?? false;
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

    const password = useMemo(() => ({ enabled: !EXTENSION_BUILD }), []);

    return {
        lock,
        biometrics,
        password,
        setLockMode,
        setLockTTL,
    };
};
