import type { FC } from 'react';

import type { PasswordScore } from '@protontech/pass-rust-core/worker';
import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { IconComponent } from '@proton/icons/component';
import { IcPassShieldFillDanger } from '@proton/icons/icons/IcPassShieldFillDanger';
import { IcPassShieldFillSuccess } from '@proton/icons/icons/IcPassShieldFillSuccess';
import { IcPassShieldFillWarning } from '@proton/icons/icons/IcPassShieldFillWarning';
import clsx from '@proton/utils/clsx';

import './PasswordStrength.scss';

// translator: refers to password strengths (eg. Strong password, Weak password)
export const translateStrengths: () => Record<PasswordScore, string> = () => ({
    Vulnerable: c('Label').t`Vulnerable`,
    Weak: c('Label').t`Weak`,
    Strong: c('Label').t`Strong`,
});

export const strengthClassNames: Record<PasswordScore, string> = {
    Vulnerable: 'pass-password-strength pass-password-strength--vulnerable',
    Weak: 'pass-password-strength pass-password-strength--weak',
    Strong: 'pass-password-strength pass-password-strength--strong',
};

export const strengthIcons: Record<PasswordScore, IconComponent> = {
    Vulnerable: IcPassShieldFillDanger,
    Weak: IcPassShieldFillWarning,
    Strong: IcPassShieldFillSuccess,
};

export const PasswordStrength: FC<{
    strength: PasswordScore;
    className?: string;
    inline?: boolean;
}> = (props) => {
    const className = strengthClassNames[props.strength];
    const StrengthIcon = strengthIcons[props.strength];
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
                <StrengthIcon size={5} className="shrink-0" alt={translatedStrength} />
            </Tooltip>

            <span>{translatedStrength}</span>
        </div>
    );
};
