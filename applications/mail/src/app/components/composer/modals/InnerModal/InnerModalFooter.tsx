import { ComponentPropsWithoutRef, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props extends ComponentPropsWithoutRef<'footer'> {
    children?: ReactNode;
    isColumn?: boolean;
}

const InnerModalFooter = ({
    children,
    isColumn,
    className = clsx([
        'flex flex-nowrap',
        isColumn ? 'flex-column' : 'justify-space-between items-center',
    ]),
    ...rest
}: Props) => {
    return (
        <footer className={clsx(['inner-modal-footer', className])} {...rest}>
            {children}
        </footer>
    );
};

export default InnerModalFooter;
