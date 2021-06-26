import React from 'react';
import { classnames } from '@proton/components';

interface Props {
    children?: React.ReactNode;
    className?: string;
}

const PopoverFooter = ({ children, className }: Props) => {
    return <footer className={classnames(['flex flex-nowrap flex-justify-end', className])}>{children}</footer>;
};

export default PopoverFooter;
