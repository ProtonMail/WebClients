import { type FC } from 'react';

import { c } from 'ttag';

import { Icon, type IconName, RadioGroup } from '@proton/components';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { LockTTLField } from '@proton/pass/components/Lock/LockTTLField';
import { PassPlusPromotionButton } from '@proton/pass/components/Upsell/PassPlusPromotionButton';
import { useLockSetup } from '@proton/pass/hooks/useLockSetup';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import clsx from '@proton/utils/clsx';

export const OnboardingLockSetup: FC = () => {
    const online = useConnectivity();
    const { setLockMode, setLockTTL, lock, biometrics, password } = useLockSetup();

    type LockModeOption = {
        value: LockMode;
        label: string;
        icon: IconName;
        needsUpgrade?: boolean;
    };

    const lockModes: LockModeOption[] = [
        {
            value: LockMode.SESSION,
            label: c('Label').t`PIN code`,
            icon: 'pass-lockmode-pin',
        },

        ...(password.enabled
            ? ([
                  {
                      value: LockMode.PASSWORD,
                      label: c('Label').t`Password`,
                      icon: 'pass-lockmode-password',
                  },
              ] as const)
            : []),

        ...(DESKTOP_BUILD && password.enabled && biometrics.enabled
            ? ([
                  {
                      value: LockMode.BIOMETRICS,
                      label: c('Label').t`Biometrics`,
                      icon: 'pass-lockmode-biometrics',
                      needsUpgrade: biometrics.needsUpgrade,
                  },
              ] as const)
            : []),
    ];

    return (
        <>
            <RadioGroup<LockMode>
                name="lock-mode"
                onChange={setLockMode}
                value={lock.mode}
                className={clsx('w-full', !online && 'opacity-70 pointer-events-none')}
                disableChange={!online || lock.loading}
                options={lockModes.map(({ value, icon, label, needsUpgrade }) => ({
                    value,
                    label: (
                        <div
                            className="pass-lock-option rounded-xl flex items-center px-custom w-full py-3"
                            style={{ '--px-custom': '0.875rem' }}
                        >
                            <Icon name={icon} size={6} />
                            <div className={clsx('flex-1 px-4', lock.mode === value && 'text-bold')}>{label}</div>
                            <div
                                style={{ '--my-custom': '2px' }}
                                className={clsx('my-custom', lock.mode !== value && 'visibility-hidden')}
                            >
                                <Icon name="checkmark-circle-filled" size={6} color="var(--interaction-norm)" />
                            </div>
                            {needsUpgrade && <PassPlusPromotionButton className="button-xs" />}
                        </div>
                    ),
                }))}
            />

            <hr className="mt-2 mb-4 border-weak shrink-0" />

            <LockTTLField
                ttl={lock.ttl.value}
                disabled={!online || lock.ttl.disabled || lock.loading}
                onChange={setLockTTL}
                label={
                    <>
                        {c('Label').t`Auto-lock after`}
                        {lock.orgControlled && (
                            <span className="color-weak text-sm">{` (${c('Info').t`Set by your organization`})`}</span>
                        )}
                    </>
                }
            />
        </>
    );
};
