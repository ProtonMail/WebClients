import { type ComponentPropsWithoutRef } from 'react';

import { c } from 'ttag';

import { IcPassShieldFillDanger, IcPassShieldFillSuccess, IcPassShieldFillWarning } from '@proton/icons';
import clsx from '@proton/utils/clsx';

import './PasswordStrengthIndicator.scss';

export type PasswordScore = 'Vulnerable' | 'Weak' | 'Strong';

export interface PasswordStrengthIndicatorProps extends ComponentPropsWithoutRef<'div'> {
    score: PasswordScore;
}

const getLayout = (type: PasswordScore) => {
    if (type === 'Strong') {
        return {
            value: c('Label').t`Strong`,
            icon: <IcPassShieldFillSuccess className="shrink-0" />,
            className: 'password-strength-indicator--strong',
        };
    }
    if (type === 'Weak') {
        return {
            value: c('Label').t`Weak`,
            icon: <IcPassShieldFillWarning className="shrink-0" />,
            className: 'password-strength-indicator--weak',
        };
    }
    return {
        value: c('Label').t`Vulnerable`,
        icon: <IcPassShieldFillDanger className="shrink-0" />,
        className: 'password-strength-indicator--vulnerable',
    };
};

const PasswordStrengthIndicator = ({ score }: PasswordStrengthIndicatorProps) => {
    const { className, icon, value } = getLayout(score);

    return (
        <div className={clsx('password-strength-indicator w-full flex flex-nowrap gap-3', className)}>
            <div
                className="password-strength-indicator-bars flex flex-1 flex-nowrap gap-1 items-center"
                aria-hidden="true"
            >
                <span className="flex-1 rounded"></span>
                <span className="flex-1 rounded"></span>
                <span className="flex-1 rounded"></span>
            </div>
            <span className="flex flex-nowrap gap-1 items-center justify-end min-w-1/4 text-right password-strength-indicator-value h-4">
                {icon}
                {value}
            </span>
        </div>
    );
};

export default PasswordStrengthIndicator;
