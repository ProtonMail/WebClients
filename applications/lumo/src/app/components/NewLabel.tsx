import React from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

export const NewLabel = ({ className }: { className?: string }) => {
    return (
        <span
            className={clsx(
                'new-label text-uppercase text-xs text-norm color-invert rounded-sm px-1 py-0.5',
                className
            )}
        >{c('collider_2025: Top nav link').t`New`}</span>
    );
};
