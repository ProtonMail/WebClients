import { ComponentPropsWithoutRef, ReactNode } from 'react';

import { classnames } from '@proton/components';

interface Props extends ComponentPropsWithoutRef<'footer'> {
    children?: ReactNode;
    isColumn?: boolean;
}

const InnerModalFooter = ({
    children,
    isColumn,
    className = classnames([
        'flex flex-nowrap',
        isColumn ? 'flex-column' : 'flex-justify-space-between flex-align-items-center',
    ]),
    ...rest
}: Props) => {
    return (
        <footer className={classnames(['inner-modal-footer', className])} {...rest}>
            {children}
        </footer>
    );
};

export default InnerModalFooter;
