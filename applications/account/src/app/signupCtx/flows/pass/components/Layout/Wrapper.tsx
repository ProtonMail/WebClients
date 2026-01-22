import type { FC, PropsWithChildren } from 'react';

import clsx from '@proton/utils/clsx';

type WrapperProps = {
    className?: string;
};

export const Wrapper: FC<PropsWithChildren<WrapperProps>> = ({ children, className }) => {
    return (
        <div className={clsx(`flex flex-column flex-nowrap flex-1 pt-8 overflow-auto`, className)}>
            <div className="flex items-center justify-center">
                <div className="flex flex-column md:flex-row flex-nowrap items-center justify-center w-full signup-layout-gap p-4">
                    {children}
                </div>
            </div>
        </div>
    );
};
