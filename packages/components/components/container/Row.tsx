import { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
    children?: ReactNode;
    className?: string;
    collapseOnMobile?: boolean;
}

const Row = ({ children, className = '', collapseOnMobile = true, ...rest }: Props) => {
    return (
        <div
            className={clsx(['flex flex-nowrap mb-4', collapseOnMobile && 'on-mobile-flex-column', className])}
            {...rest}
        >
            {children}
        </div>
    );
};

export default Row;
