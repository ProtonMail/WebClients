import type { FC } from 'react';

import { Donut } from '@proton/atoms/Donut';
import { ThemeColor } from '@proton/colors/types';
import clsx from '@proton/utils/clsx';

import './OTPDonut.scss';

type Props = { enabled: boolean; percent: number; period?: number };

export const OTPDonut: FC<Props> = ({ enabled, percent, period = 0 }) => (
    <div
        className={clsx('pass-otp--donut pointer-events-none anime-fade-in')}
        style={{ '--countdown-value': `"${Math.round(percent * period)}"` }}
    >
        {enabled && (
            <Donut segments={[[percent * 100, ThemeColor.Success]]} backgroundSegmentColor="var(--text-hint)" />
        )}
    </div>
);
