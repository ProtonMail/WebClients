import { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';

import { classnames } from '@proton/components';

interface Props extends DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement> {
    id: string;
    children: ReactNode;
}

const InnerModalTitle = ({ children, className, ...rest }: Props) => {
    return (
        <h1
            className={classnames(['inner-modal-title outline-none', className])}
            data-focus-trap-fallback="0"
            tabIndex={-1}
            {...rest}
        >
            {children}
        </h1>
    );
};

export default InnerModalTitle;
