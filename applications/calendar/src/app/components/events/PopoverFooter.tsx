import * as React from 'react';
import { classnames } from '@proton/components';

interface Props {
    children?: React.ReactNode;
    className?: string;
}

const PopoverFooter = ({ children, className }: Props) => {
    return <footer className={classnames(['flex', className])}>{children}</footer>;
};

export default PopoverFooter;
