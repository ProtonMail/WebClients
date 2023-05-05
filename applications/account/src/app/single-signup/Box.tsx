import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import './Box.scss';

const Box = ({ children, className }: { children: ReactNode; className?: string }) => {
    return (
        <div
            className={clsx(
                'pricing-box ui-standard relative shadow-lifted shadow-color-primary on-tiny-mobile-no-box-shadow rounded-xl md:p-11 p-4',
                className
            )}
        >
            {children}
        </div>
    );
};

export default Box;
