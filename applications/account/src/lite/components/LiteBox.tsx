import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props {
    center?: boolean;
    children: ReactNode;
    maxWidth?: number;
}

const LiteBox = ({ center = true, children, maxWidth = 52 }: Props) => {
    return (
        <div className={clsx('flex flex-justify-center', center ? 'flex-align-items-center h-full' : '')}>
            <div
                className="m-0 sm:m-4 p-4 sm:p-8 rounded shadow-lifted on-tiny-mobile-no-box-shadow bg-norm w-full max-w-custom"
                style={{ '--max-w-custom': `${maxWidth}rem` }}
            >
                {children}
            </div>
        </div>
    );
};

export default LiteBox;
