import type { FC17 } from 'react';

import { c } from 'ttag';

import { Pill } from '@proton/atoms/Pill';

export const EarlyAccessBadge: FC17 = () => (
    <span className="text-sm">
        <Pill
            className="text-uppercase text-semibold"
            color="var(--interaction-norm)"
            backgroundColor="var(--interaction-weak)"
        >
            {c('Badge').t`Early access`}
        </Pill>
    </span>
);
