import type { FC } from 'react';

import { c } from 'ttag';

import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';

import { useLockSettings } from '../../../hooks/useLockSettings';

type LockSelectProps = {
    disabled?: boolean;
};
export const LockSelect: FC<LockSelectProps> = ({ disabled }) => {
    const { appLock, setLockMode, biometricsEnabled } = useLockSettings();

    return (
        <SelectTwo value={appLock} disabled={disabled} onChange={({ value }) => setLockMode(value)}>
            <Option title={c('authenticator-2025:Label').t`None`} value="none" />
            <Option title={c('authenticator-2025:Label').t`Password`} value="password" />
            {biometricsEnabled && <Option title={c('authenticator-2025:Label').t`Biometrics`} value="biometrics" />}
        </SelectTwo>
    );
};
