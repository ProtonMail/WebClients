import { HTMLAttributes, ReactNode, Ref, forwardRef } from 'react';

import clsx from '@proton/utils/clsx';

interface Props extends HTMLAttributes<HTMLDivElement> {
    className?: string;
    children?: ReactNode;
    hasToolbar?: boolean;
    hasRowMode?: boolean;
    drawerSidebar?: ReactNode;
    drawerVisibilityButton?: ReactNode;
    isDrawerApp?: boolean;
    mainBordered?: boolean;
}

const PrivateMainAreaBase = (
    {
        className,
        hasToolbar = false,
        children,
        hasRowMode = false,
        drawerSidebar,
        drawerVisibilityButton,
        isDrawerApp,
        mainBordered = true,
        ...rest
    }: Props,
    ref: Ref<HTMLDivElement>
) => {
    const hasDrawerSidebar = !!drawerSidebar && !isDrawerApp;

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
            <div className={clsx('flex flex-nowrap w100', drawerSidebar ? 'h100 relative overflow-hidden' : undefined)}>
                <div
                    className={clsx(
                        'flex flex-nowrap w100 h100',
                        hasDrawerSidebar ? 'main-area-border' : 'scroll-if-needed',
                        hasDrawerSidebar && mainBordered && 'main-area-rounded'
                    )}
                >
                    {children}
                </div>
                {drawerVisibilityButton}
                {drawerSidebar}
            </div>
        </main>
    );
};

const PrivateMainArea = forwardRef(PrivateMainAreaBase);

export default PrivateMainArea;
