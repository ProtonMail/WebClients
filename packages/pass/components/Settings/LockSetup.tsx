import type { FC } from 'react';

import { c } from 'ttag';

import RadioGroup from '@proton/components/components/input/RadioGroup';
import { useOnline } from '@proton/pass/components/Core/ConnectivityProvider';
import { LockTTLField } from '@proton/pass/components/Lock/LockTTLField';
import { usePasswordTypeSwitch } from '@proton/pass/components/Lock/PasswordUnlockProvider';
import { useLockSetup } from '@proton/pass/hooks/auth/useLockSetup';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

type Props = { noTTL?: boolean };

export const LockSetup: FC<Props> = ({ noTTL = false }) => {
    const online = useOnline();
    const { setLockMode, setLockTTL, lock, biometrics, password } = useLockSetup();
    const passwordTypeSwitch = usePasswordTypeSwitch();
    const desktopUnlockFeatureFlag = useFeatureFlag(PassFeature.PassDesktopUnlock);

    /**
     * Available on desktop,
     * or web when feature flag enabled,
     * or if lockMode is already biometrics (eg. when rolling back the flag)
     */
    const showBiometricsOption =
        password.enabled && BUILD_TARGET !== 'linux' && (DESKTOP_BUILD || lock.mode === LockMode.BIOMETRICS);

    const showDesktopOption = EXTENSION_BUILD && (desktopUnlockFeatureFlag || lock.mode === LockMode.DESKTOP);

    const biometricsText = c('Info').t`Access to ${PASS_APP_NAME} will require your fingerprint or device PIN.`;

    const biometricsHint = (() => {
        if (biometrics.enabled) {
            return biometricsText;
        }

        if (DESKTOP_BUILD) {
            return c('Info').t`This option is currently not available on your device.`;
        }

        return c('Info').t`This option is currently not available on your browser.`;
    })();

    return (
        <>
            <RadioGroup<LockMode>
                name="lock-mode"
                onChange={setLockMode}
                value={lock.mode}
                className={clsx('flex-nowrap gap-3', !online && 'opacity-70 pointer-events-none')}
                disableChange={!online || lock.loading}
                options={[
                    ...(!lock.orgControlled
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
                    ...(password.enabled
                        ? [
                              {
                                  label: (
                                      <span className="block">
                                          {c('Label').t`Password`}
                                          <span className="block color-weak text-sm">
                                              {passwordTypeSwitch({
                                                  sso: c('Info')
                                                      .t`Access to ${PASS_APP_NAME} will always require your backup password.`,
                                                  extra: c('Info')
                                                      .t`Access to ${PASS_APP_NAME} will always require your extra password.`,
                                                  twoPwd: c('Info')
                                                      .t`Access to ${PASS_APP_NAME} will always require your second password.`,
                                                  default: c('Info')
                                                      .t`Access to ${PASS_APP_NAME} will always require your ${BRAND_NAME} password.`,
                                              })}
                                          </span>
                                      </span>
                                  ),
                                  value: LockMode.PASSWORD,
                              },
                          ]
                        : []),

                    ...(showBiometricsOption
                        ? [
                              {
                                  label: (
                                      <span className="flex w-full justify-space-between items-center">
                                          <span className="block">
                                              {c('Label').t`Biometrics`}
                                              <span className="block color-weak text-sm">{biometricsHint}</span>
                                          </span>
                                      </span>
                                  ),
                                  disabled: !biometrics.enabled,
                                  value: LockMode.BIOMETRICS,
                              },
                          ]
                        : []),

                    ...(showDesktopOption
                        ? [
                              {
                                  label: (
                                      <span className="flex w-full justify-space-between items-center">
                                          <span className="block">
                                              {c('Label').t`Biometrics`}
                                              <span className="block color-weak text-sm">{biometricsText}</span>
                                              <span className="block color-weak text-sm">{c('Info')
                                                  .t`This feature requires the ${PASS_APP_NAME} desktop app to be installed and running during setup.`}</span>
                                          </span>
                                      </span>
                                  ),
                                  value: LockMode.DESKTOP,
                              },
                          ]
                        : []),
                ]}
            />

            {!noTTL && (
                <>
                    <hr className="mt-2 mb-4 border-weak shrink-0" />
                    <LockTTLField
                        ttl={lock.ttl.value}
                        disabled={!online || lock.ttl.disabled || lock.loading}
                        onChange={setLockTTL}
                        label={
                            <>
                                {c('Label').t`Auto-lock after`}
                                {lock.orgControlled && (
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
