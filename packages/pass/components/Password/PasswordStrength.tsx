import type { FC } from 'react';

import type { WasmPasswordScore } from '@protontech/pass-rust-core';
import { c } from 'ttag';

import { Tooltip } from '@proton/components';
import { Icon, type IconName } from '@proton/components/components/icon';
import clsx from '@proton/utils/clsx';

import './PasswordStrength.scss';

// translator: refers to password strengths (eg. Strong password, Weak password)
export const translateStrengths: () => Record<WasmPasswordScore, string> = () => ({
    Vulnerable: c('Label').t`Vulnerable`,
    Weak: c('Label').t`Weak`,
    Strong: c('Label').t`Strong`,
});

export const strengthClassNames: Record<WasmPasswordScore, string> = {
    Vulnerable: 'pass-password-strength pass-password-strength--vulnerable',
    Weak: 'pass-password-strength pass-password-strength--weak',
    Strong: 'pass-password-strength pass-password-strength--strong',
};

export const strenghtIconNames: Record<WasmPasswordScore, IconName> = {
    Vulnerable: 'pass-shield-fill-danger',
    Weak: 'pass-shield-fill-warning',
    Strong: 'pass-shield-fill-success',
};

export const PasswordStrength: FC<{
    strength: WasmPasswordScore;
    className?: string;
    inline?: boolean;
}> = (props) => {
    const className = strengthClassNames[props.strength];
    const strengthIcon = strenghtIconNames[props.strength];
    const translatedStrength = translateStrengths()[props.strength];

    return (
        <div
            className={clsx(
                className,
                props.className,
                props.inline && 'pass-password-strength--inline',
                'flex flex-nowrap items-center user-select-none overflow-hidden gap-2'
            )}
        >
            <Tooltip title={translatedStrength}>
                <Icon name={strengthIcon} size={5} className="shrink-0" alt={translatedStrength} />
            </Tooltip>

            <span>{translatedStrength}</span>
        </div>
    );
};
