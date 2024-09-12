import type { FC } from 'react';

import { c } from 'ttag';

import { Option, SelectTwo } from '@proton/components';
import type { UsePasswordGeneratorResult } from '@proton/pass/hooks/usePasswordGenerator';
import type { GeneratePasswordConfig } from '@proton/pass/lib/password/generator';
import clsx from '@proton/utils/clsx';

import './PasswordTypeSelect.scss';

type Props = UsePasswordGeneratorResult & { dense?: boolean };

export const PasswordTypeSelect: FC<Props> = ({ config, dense = false, setPasswordOptions }) => (
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
            />
            <Option
                title={c('Option').t`Random Password`}
                value="random"
                className={clsx(dense && 'text-sm')}
                preventScroll
            />
        </SelectTwo>
    </div>
);
