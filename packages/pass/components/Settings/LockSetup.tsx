import { type FC } from 'react';

import { c } from 'ttag';

import { RadioGroup } from '@proton/components';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { LockTTLField } from '@proton/pass/components/Lock/LockTTLField';
import { PassPlusPromotionButton } from '@proton/pass/components/Upsell/PassPlusPromotionButton';
import { useLockSetup } from '@proton/pass/hooks/useLockSetup';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

type Props = { noTTL?: boolean };

export const LockSetup: FC<Props> = ({ noTTL = false }) => {
    const online = useConnectivity();
    const { setLockMode, setLockTTL, lock, biometrics, password } = useLockSetup();

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
                                          <span className="block color-weak text-sm">{c('Info')
                                              .t`Access to ${PASS_APP_NAME} will always require your ${BRAND_NAME} password.`}</span>
                                      </span>
                                  ),
                                  value: LockMode.PASSWORD,
                              },
                          ]
                        : []),

                    ...(DESKTOP_BUILD && password.enabled
                        ? [
                              {
                                  label: (
                                      <span className="flex w-full justify-space-between items-center">
                                          <span className="block">
                                              {c('Label').t`Biometrics`}
                                              <span className="block color-weak text-sm">
                                                  {biometrics.enabled
                                                      ? c('Info')
                                                            .t`Access to ${PASS_APP_NAME} will require your fingerprint or device PIN.`
                                                      : c('Info')
                                                            .t`This option is currently not available on your device.`}
                                              </span>
                                          </span>
                                          {biometrics.needsUpgrade && <PassPlusPromotionButton className="button-xs" />}
                                      </span>
                                  ),
                                  disabled: !biometrics.enabled,
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
