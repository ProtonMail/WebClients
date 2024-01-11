import type { FC } from 'react';

import type { IconSize } from '@proton/components/components';
import type { PassIconStatus } from '@proton/pass/types/data/pass-icon';

type Props = { status: PassIconStatus; size: IconSize; className?: string };

export const PassIcon: FC<Props> = ({ status, size, className }) => (
    <img src={`/assets/${status}.svg`} width={size} height={size} alt={''} className={className} />
);
