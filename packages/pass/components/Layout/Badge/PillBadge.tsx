import type { FC, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

type Props = {
    backgroundColor?: string;
    className?: string;
    color?: string;
    label: ReactNode;
};

export const PillBadge: FC<Props> = ({
    backgroundColor = 'var(--interaction-norm)',
    className,
    color = 'var(--interaction-norm-contrast)',
    label,
}) => (
    <div
        className={clsx('text-sm inline-block rounded-full text-normal inline-block px-2 py-0.5', className)}
        style={{ backgroundColor, color }}
    >
        {label}
    </div>
);
