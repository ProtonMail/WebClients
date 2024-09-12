import type { FC } from 'react';

import type { IconSize } from '@proton/components';
import type { PassIconStatus } from '@proton/pass/types/data/pass-icon';

import { getIconSizePx } from './IconBox';

type Props = { status: PassIconStatus; size: IconSize; className?: string };

export const PassIcon: FC<Props> = ({ status, size, className }) => (
    <img
        src={`/assets/${status}.svg`}
        width={getIconSizePx(size)}
        height={getIconSizePx(size)}
        alt=""
        className={className}
    />
);
