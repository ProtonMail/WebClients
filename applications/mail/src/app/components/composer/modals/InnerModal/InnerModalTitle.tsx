import { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props extends DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement> {
    id: string;
    children: ReactNode;
}

const InnerModalTitle = ({ children, className, ...rest }: Props) => {
    return (
        <h1
            className={clsx(['inner-modal-title outline-none pr-4', className])}
            data-focus-trap-fallback="0"
            tabIndex={-1}
            {...rest}
        >
            {children}
        </h1>
    );
};

export default InnerModalTitle;
