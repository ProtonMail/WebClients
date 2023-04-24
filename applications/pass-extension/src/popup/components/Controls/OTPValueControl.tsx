import { type VFC } from 'react';

import { c } from 'ttag';

import { Donut } from '@proton/atoms/Donut';
import { ThemeColor } from '@proton/colors/types';
import clsx from '@proton/utils/clsx';

import { Props as UsePeriodicOtpCodeProps, usePeriodicOtpCode } from '../../hooks/usePeriodicOtpCode';
import { ClickToCopyValue } from './ClickToCopyValue';
import { ValueControl } from './ValueControl';

import './OTPValueControl.scss';

const renderOtpCodeDisplayValue = (code: string): string => {
    if (!code || code.length % 2) {
        return code;
    }

    const pair = Array.from(code);
    pair.splice(code.length / 2, 0, '•');
    return pair.join('');
};

/* This component handles the period otp code generation
 * to avoid cluttering the render cycle of a component in
 * need of the OTP code generation as it involves alot of
 * re-rendering. eg: we do not want to re-render `Login.view`
 * everytime the OTP countdown updates */
export const OTPValueControl: VFC<UsePeriodicOtpCodeProps> = ({ shareId, itemId, totpUri }) => {
    const [otp, percent] = usePeriodicOtpCode({ shareId, itemId, totpUri });

    return (
        <ClickToCopyValue value={otp?.token ?? ''}>
            <ValueControl
                interactive
                icon="lock"
                label={c('Label').t`2FA token (TOTP)`}
                actions={
                    <div
                        className={clsx('pass-otp--donut no-pointer-events')}
                        style={{ '--countdown-value': `"${Math.round(percent * (otp?.period ?? 0))}"` }}
                    >
                        {otp !== null && (
                            <Donut
                                segments={[[percent * 100, ThemeColor.Success]]}
                                backgroundSegmentColor="var(--text-hint)"
                            />
                        )}
                    </div>
                }
            >
                {renderOtpCodeDisplayValue(otp?.token ?? '')}
            </ValueControl>
        </ClickToCopyValue>
    );
};
