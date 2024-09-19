import type { HTMLAttributes, ReactNode, Ref } from 'react';
import { forwardRef } from 'react';

import clsx from '@proton/utils/clsx';

import { useTheme } from '../themes/ThemeProvider';

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
    const theme = useTheme();
    const isProminent = theme.information.prominentHeader;

    return (
        <main
            className={clsx([
                hasToolbar ? 'main-area--with-toolbar' : 'main-area',
                hasRowMode ? 'main-area--row-mode' : undefined,
                !drawerSidebar && !isProminent ? 'main-area-border' : undefined,
                'flex-auto relative h-full reset4print outline-none--at-all',
                className,
            ])}
            ref={ref}
            tabIndex={-1}
            {...rest}
        >
            <div
                className={clsx(
                    'flex flex-nowrap w-full',
                    drawerSidebar ? 'h-full relative overflow-hidden' : undefined,
                    isProminent ? 'ui-prominent' : undefined
                )}
            >
                <div
                    className={clsx(
                        'flex flex-nowrap w-full h-full',
                        hasDrawerSidebar ? 'main-area-border overflow-hidden' : 'overflow-auto',
                        hasDrawerSidebar && mainBordered ? 'main-area-rounded--right' : undefined,
                        isProminent ? 'ui-standard main-area-rounded--left' : undefined
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
