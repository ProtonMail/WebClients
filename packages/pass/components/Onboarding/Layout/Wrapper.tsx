import type { FC, PropsWithChildren } from 'react';

import clsx from '@proton/utils/clsx';

import type { ContentLayout } from './Layout';

type WrapperProps = {
    className?: string;
    contentLayout?: ContentLayout;
};

export const Wrapper: FC<PropsWithChildren<WrapperProps>> = ({ children, className, contentLayout = 'centered' }) => {
    if (contentLayout === 'fill') {
        return <div className={clsx(`flex flex-column flex-nowrap flex-1 min-h-0`, className)}>{children}</div>;
    }

    return (
        <div className={clsx(`flex flex-column flex-nowrap flex-1 overflow-auto`, className)}>
            <div className="flex items-center justify-center">
                <div className="flex flex-column md:flex-row flex-nowrap items-center justify-center w-full signup-layout-gap">
                    {children}
                </div>
            </div>
        </div>
    );
};
