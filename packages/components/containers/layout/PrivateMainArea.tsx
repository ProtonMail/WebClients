import { HTMLAttributes, ReactNode, Ref, forwardRef } from 'react';

import clsx from '@proton/utils/clsx';

interface Props extends HTMLAttributes<HTMLDivElement> {
    className?: string;
    children?: ReactNode;
    hasToolbar?: boolean;
    hasRowMode?: boolean;
}

const PrivateMainAreaBase = (
    { className, hasToolbar = false, children, hasRowMode = false, ...rest }: Props,
    ref: Ref<HTMLDivElement>
) => {
    return (
        <main
            className={clsx([
                hasToolbar ? 'main-area--with-toolbar' : 'main-area',
                hasRowMode ? 'main-area--row-mode' : '',
                'flex-item-fluid-auto relative',
                className,
            ])}
            ref={ref}
            {...rest}
        >
            {children}
        </main>
    );
};

const PrivateMainArea = forwardRef(PrivateMainAreaBase);

export default PrivateMainArea;
