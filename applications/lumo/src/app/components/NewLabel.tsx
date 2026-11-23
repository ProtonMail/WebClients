import React from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

export const NewLabel = ({ className }: { className?: string }) => {
    return (
        <span
            className={clsx(
                'px-1 py-0.5 radius-4 lumo-label-small text-uppercase lumo-color-control-brand-text lumo-bg-control-brand-fill',
                className
            )}
        >{c('collider_2025: Top nav link').t`New`}</span>
    );
};
