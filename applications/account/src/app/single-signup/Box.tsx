import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import './Box.scss';

const Box = ({ children, className }: { children: ReactNode; className?: string }) => {
    return (
        <div
            className={clsx(
                'pricing-box ui-standard relative sm:shadow-lifted shadow-color-primary rounded-xl',
                className
            )}
        >
            {children}
        </div>
    );
};

export default Box;
