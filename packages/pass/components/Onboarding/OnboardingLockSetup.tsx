import type { ReactNode } from 'react';
import { type FC, useMemo } from 'react';

import { c } from 'ttag';

import RadioGroup from '@proton/components/components/input/RadioGroup';
import type { IconComponent } from '@proton/icons/component';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcFingerprint } from '@proton/icons/icons/IcFingerprint';
import { IcPassLockmodeBiometrics } from '@proton/icons/icons/IcPassLockmodeBiometrics';
import { IcPassLockmodeNone } from '@proton/icons/icons/IcPassLockmodeNone';
import { IcPassLockmodePassword } from '@proton/icons/icons/IcPassLockmodePassword';
import { IcPassLockmodePin } from '@proton/icons/icons/IcPassLockmodePin';
import { isMac } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import { useLockSetup } from '../../hooks/auth/useLockSetup';
import { LockMode } from '../../lib/auth/lock/types';
import { prop } from '../../utils/fp/lens';
import { useOnline } from '../Core/ConnectivityProvider';
import { LockTTLField } from '../Lock/LockTTLField';

type LockModeOption = {
    value: LockMode;
    label: ReactNode;
    icon: IconComponent;
    active: boolean;
};

export const OnboardingLockSetup: FC = () => {
    const online = useOnline();
    const { setLockMode, setLockTTL, lock, biometrics, extensionBiometrics, password } = useLockSetup();

    const lockModes = useMemo<LockModeOption[]>(() => {
        const options: LockModeOption[] = [
            {
                value: LockMode.SESSION,
                label: c('Label').t`PIN code`,
                icon: IcPassLockmodePin,
                active: true,
            },
            {
                value: LockMode.PASSWORD,
                label: c('Label').t`Password`,
                icon: IcPassLockmodePassword,
                active: password.enabled,
            },
            {
                value: LockMode.BIOMETRICS,
                label: c('Label').t`Biometrics`,
                icon: isMac() ? IcFingerprint : IcPassLockmodeBiometrics,
                active: DESKTOP_BUILD && password.enabled && biometrics.enabled,
            },
            {
                value: LockMode.DESKTOP,
                label: c('Label').t`Biometrics`,
                icon: isMac() ? IcFingerprint : IcPassLockmodeBiometrics,
                active: EXTENSION_BUILD && extensionBiometrics.enabled,
            },
            {
                value: LockMode.NONE,
                label: (
                    <>
                        <span className="mr-2">{c('Label').t`None`}</span>
                        <span className="color-weak text-sm align-end">({c('Info').t`Not recommended`})</span>
                    </>
                ),
                icon: IcPassLockmodeNone,
                active: !lock.orgControlled,
            },
        ];

        return options.filter(prop('active'));
    }, [lock, password, biometrics]);

    return (
        <>
            <RadioGroup<LockMode>
                name="onboarding-lock-mode"
                onChange={setLockMode}
                value={lock.mode}
                className={clsx('pass-onboarding-modal--radio w-full', !online && 'opacity-70 pointer-events-none')}
                disableChange={!online || lock.loading}
                options={lockModes.map(({ value, icon: Icon, label }) => ({
                    value,
                    label: (
                        <div className="pass-onboarding-modal--option rounded-xl flex items-center w-full py-3 px-4">
                            <Icon size={6} />
                            <div className={clsx('flex-1 px-4', lock.mode === value && 'text-bold')}>{label}</div>
                            {lock.mode === value && (
                                <IcCheckmarkCircleFilled size={6} color="var(--interaction-norm)" />
                            )}
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
