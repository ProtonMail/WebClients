import type { VFC17 } from 'react';

import type { IconSize } from '@proton/components/components';
import type { PassIconStatus } from '@proton/pass/types/data/pass-icon';

type Props = { status: PassIconStatus; size: IconSize; className?: string };

export const PassIcon: VFC17<Props> = ({ status, size, className }) => (
    <img src={`/assets/${status}.svg`} width={size} height={size} alt={''} className={className} />
);
