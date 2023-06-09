import { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props extends DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement> {
    id: string;
    children: ReactNode;
}

/**
 * @deprecated Please use ModalTwo instead
 */
const Title = ({ children, className, ...rest }: Props) => {
    return (
        <h1
            className={clsx(['modal-title outline-none', className])}
            data-focus-trap-fallback="0"
            tabIndex={-1}
            {...rest}
        >
            {children}
        </h1>
    );
};

export default Title;
