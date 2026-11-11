import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props {
    children: ReactNode;
    /**
     * Style overrides for the Main/Aside row, e.g. its cross-axis alignment: `items-start` when Aside
     * is noticeably shorter than Main, since `items-center` would otherwise push it down with an
     * empty gap above instead of starting level.
     */
    className?: string;
}

export const Wrapper = ({ children, className }: Props) => (
    <div
        className={clsx(
            'flex flex-column md:flex-row flex-nowrap justify-center w-full grow p-4 md:px-8 gap-4 md:gap-custom',
            className
        )}
        style={{ '--md-gap-custom': 'min(7vw, 10rem)' }}
    >
        {children}
    </div>
);
