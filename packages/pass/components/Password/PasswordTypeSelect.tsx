import type { FC } from 'react';

import { c } from 'ttag';

import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import type { PasswordGeneratorResult } from '@proton/pass/hooks/usePasswordGenerator';
import type { GeneratePasswordConfig } from '@proton/pass/lib/password/types';
import type { MaybeNull, OrganizationUpdatePasswordPolicyRequest } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import './PasswordTypeSelect.scss';

type Props = PasswordGeneratorResult & {
    dense?: boolean;
    policy: MaybeNull<OrganizationUpdatePasswordPolicyRequest>;
};

export const PasswordTypeSelect: FC<Props> = ({ config, dense = false, setPasswordOptions, policy }) => (
    <div className="flex items-center justify-space-between gap-x-2">
        <label htmlFor="password-type" className="shrink-0">
            {c('Label').t`Type`}
        </label>
        <SelectTwo<GeneratePasswordConfig['type']>
            id="password-type"
            value={config.type}
            className="pass-password-generator--select border-none text-rg flex-1"
            onValue={(type) => setPasswordOptions(type)}
        >
            <Option
                title={c('Option').t`Memorable Password`}
                value="memorable"
                className={clsx(dense && 'text-sm')}
                preventScroll
                disabled={policy?.MemorablePasswordAllowed === false}
            />
            <Option
                title={c('Option').t`Random Password`}
                value="random"
                className={clsx(dense && 'text-sm')}
                preventScroll
                disabled={policy?.RandomPasswordAllowed === false}
            />
        </SelectTwo>
    </div>
);
