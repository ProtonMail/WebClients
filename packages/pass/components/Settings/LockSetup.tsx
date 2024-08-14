import { type FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { RadioGroup, useNotifications } from '@proton/components';
import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { LockTTLField } from '@proton/pass/components/Lock/LockTTLField';
import { usePasswordUnlock } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { usePinUnlock } from '@proton/pass/components/Lock/PinUnlockProvider';
import { useUnlock } from '@proton/pass/components/Lock/UnlockProvider';
import { useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { PassPlusPromotionButton } from '@proton/pass/components/Upsell/PassPlusPromotionButton';
import { DEFAULT_LOCK_TTL, UpsellRef } from '@proton/pass/constants';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
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
import { PassFeature } from '@proton/pass/types/api/features';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import { SETTINGS_PASSWORD_MODE } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

type Props = { noTTL?: boolean };

export const LockSetup: FC<Props> = ({ noTTL = false }) => {
    const { getBiometricsKey } = usePassCore();
    const confirmPin = usePinUnlock();
    const confirmPassword = usePasswordUnlock();
    const authStore = useAuthStore();
    const org = useOrganization({ sync: true });
    const orgLockTTL = org?.settings.ForceLockSeconds;

    const { createNotification } = useNotifications();
    const online = useConnectivity();

    const pwdMode = useSelector(selectUserSettings)?.Password?.Mode;
    const lockTTL = useSelector(selectLockTTL);
    const currentLockMode = useSelector(selectLockMode);
    const twoPwdMode = pwdMode === SETTINGS_PASSWORD_MODE.TWO_PASSWORD_MODE;
    const hasOfflinePassword = authStore?.hasOfflinePassword() ?? false;
    const hasExtraPassword = useSelector(selectExtraPasswordEnabled);
    const canPasswordLock = !EXTENSION_BUILD && (!twoPwdMode || hasOfflinePassword);
    const canToggleTTL = currentLockMode !== LockMode.NONE && !orgLockTTL;
    const biometricsRolledOut = useFeatureFlag(PassFeature.PassDesktopBiometrics);
    const [biometricsEnabled, setBiometricsEnabled] = useState(currentLockMode === LockMode.BIOMETRICS);
    const plan = useSelector(selectPassPlan);
    const onFreePlan = !isPaidPlan(plan);
    const spotlight = useSpotlight();

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
        if (onFreePlan && mode === LockMode.BIOMETRICS) {
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

    const handleLockTTLChange = async (ttl: number) => {
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
            setBiometricsEnabled(canCheckPresence && biometricsRolledOut);
        })().catch(noop);
    }, [currentLockMode, biometricsRolledOut]);

    return (
        <>
            <RadioGroup<LockMode>
                name="lock-mode"
                onChange={handleLockModeSwitch}
                value={nextLock?.mode ?? currentLockMode}
                className={clsx('flex-nowrap gap-3', !online && 'opacity-70 pointer-events-none')}
                disableChange={!online || createLock.loading}
                options={[
                    ...(!orgLockTTL
                        ? [
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
                          ]
                        : []),
                    {
                        label: (
                            <span className="block">
                                {c('Label').t`PIN code`}
                                <span className="block color-weak text-sm">{c('Info')
                                    .t`Online access to ${PASS_APP_NAME} will require a PIN code. You'll be logged out after 3 failed attempts.`}</span>
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

                    ...(DESKTOP_BUILD && canPasswordLock && biometricsRolledOut
                        ? [
                              {
                                  label: (
                                      <span className="flex w-full justify-space-between items-center">
                                          <span className="block">
                                              {c('Label').t`Biometrics`}
                                              <span className="block color-weak text-sm">
                                                  {biometricsEnabled
                                                      ? c('Info')
                                                            .t`Access to ${PASS_APP_NAME} will require your fingerprint or device PIN.`
                                                      : c('Info')
                                                            .t`This option is currently not available on your device.`}
                                              </span>
                                          </span>
                                          {onFreePlan && <PassPlusPromotionButton className="button-xs" />}
                                      </span>
                                  ),
                                  disabled: !biometricsEnabled,
                                  value: LockMode.BIOMETRICS,
                              },
                          ]
                        : []),
                ]}
            />

            {!noTTL && (
                <>
                    <hr className="mt-2 mb-4 border-weak shrink-0" />
                    <LockTTLField
                        ttl={nextLock?.ttl || orgLockTTL || lockTTL}
                        disabled={!online || !canToggleTTL || createLock.loading}
                        onChange={handleLockTTLChange}
                        label={
                            <>
                                {c('Label').t`Auto-lock after`}
                                {Boolean(orgLockTTL) && (
                                    <span className="color-weak text-sm">
                                        {` (${c('Info').t`Set by your organization`})`}
                                    </span>
                                )}
                            </>
                        }
                    />
                </>
            )}
        </>
    );
};
