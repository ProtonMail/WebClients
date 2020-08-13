import React, { Ref } from 'react';
import { classnames } from '../../helpers';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    children: React.ReactNode;
    hasToolbar?: boolean;
    hasRowMode?: boolean;
}
const PrivateMainArea = React.forwardRef(
    ({ className, hasToolbar = false, children, hasRowMode = false, ...rest }: Props, ref: Ref<HTMLDivElement>) => {
        return (
            <main
                className={classnames([
                    'flex-item-fluid',
                    'relative',
                    hasToolbar ? 'main-area--withToolbar' : 'main-area',
                    hasRowMode ? 'main-area--rowMode' : '',
                    className,
                ])}
                ref={ref}
                {...rest}
            >
                {children}
            </main>
        );
    }
);

export default PrivateMainArea;
