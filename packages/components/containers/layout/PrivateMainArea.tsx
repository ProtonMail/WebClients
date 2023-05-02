import { HTMLAttributes, ReactNode, Ref, forwardRef } from 'react';

import clsx from '@proton/utils/clsx';

interface Props extends HTMLAttributes<HTMLDivElement> {
    className?: string;
    children?: ReactNode;
    hasToolbar?: boolean;
    hasRowMode?: boolean;
    drawerSidebar?: ReactNode;
    isDrawerApp?: boolean;
}

const PrivateMainAreaBase = (
    { className, hasToolbar = false, children, hasRowMode = false, drawerSidebar, isDrawerApp, ...rest }: Props,
    ref: Ref<HTMLDivElement>
) => {
    return (
        <main
            className={clsx([
                hasToolbar ? 'main-area--with-toolbar' : 'main-area',
                hasRowMode ? 'main-area--row-mode' : undefined,
                !drawerSidebar ? 'main-area-border' : undefined,
                'flex-item-fluid-auto relative',
                className,
            ])}
            ref={ref}
            {...rest}
        >
            <div className={clsx('flex flex-nowrap w100', drawerSidebar ? 'h100' : undefined)}>
                <div
                    className={clsx(
                        'flex flex-nowrap w100 h100',
                        drawerSidebar && !isDrawerApp ? 'main-area-border main-area-rounded' : 'scroll-if-needed'
                    )}
                >
                    {children}
                </div>
                {drawerSidebar}
            </div>
        </main>
    );
};

const PrivateMainArea = forwardRef(PrivateMainAreaBase);

export default PrivateMainArea;
