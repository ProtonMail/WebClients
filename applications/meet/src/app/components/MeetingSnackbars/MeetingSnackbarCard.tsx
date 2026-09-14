import type { HTMLAttributes, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export const MeetingSnackbarCard = ({ children, className, ...rest }: Props) => (
    <div
        className={clsx(
            'bg-norm border border-norm rounded-xl p-4 flex flex-nowrap justify-space-between items-center overflow-hidden',
            className
        )}
        {...rest}
    >
        {children}
    </div>
);
