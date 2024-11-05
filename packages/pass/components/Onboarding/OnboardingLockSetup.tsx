import { type FC, useMemo } from 'react';

import { c } from 'ttag';

import { Icon, type IconName, RadioGroup } from '@proton/components';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { LockTTLField } from '@proton/pass/components/Lock/LockTTLField';
import { PassPlusPromotionButton } from '@proton/pass/components/Upsell/PassPlusPromotionButton';
import { useLockSetup } from '@proton/pass/hooks/useLockSetup';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { isMac } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

type LockModeOption = {
    value: LockMode;
    label: string;
    icon: IconName;
    needsUpgrade?: boolean;
    active: boolean;
};

export const OnboardingLockSetup: FC = () => {
    const online = useConnectivity();
    const { setLockMode, setLockTTL, lock, biometrics, password } = useLockSetup();

    const lockModes = useMemo<LockModeOption[]>(() => {
        const options: LockModeOption[] = [
            {
                value: LockMode.SESSION,
                label: c('Label').t`PIN code`,
                icon: 'pass-lockmode-pin',
                active: true,
            },
            {
                value: LockMode.PASSWORD,
                label: c('Label').t`Password`,
                icon: 'pass-lockmode-password',
                active: password.enabled,
            },
            {
                value: LockMode.BIOMETRICS,
                label: c('Label').t`Biometrics`,
                icon: isMac() ? 'fingerprint' : 'pass-lockmode-biometrics',
                needsUpgrade: biometrics.needsUpgrade,
                active: DESKTOP_BUILD && password.enabled && biometrics.enabled,
            },
        ];

        return options.filter(prop('active'));
    }, [lock, password, biometrics]);

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
                        <div className="pass-lock-option rounded-xl flex items-center w-full py-3 px-4">
                            <Icon name={icon} size={6} />
                            <div className={clsx('flex-1 px-4', lock.mode === value && 'text-bold')}>{label}</div>
                            {lock.mode === value && (
                                <Icon name="checkmark-circle-filled" size={6} color="var(--interaction-norm)" />
                            )}
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
