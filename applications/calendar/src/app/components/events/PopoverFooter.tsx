import * as React from 'react';

import clsx from '@proton/utils/clsx';

interface Props {
    children?: React.ReactNode;
    className?: string;
}

const PopoverFooter = ({ children, className }: Props) => {
    return <footer className={clsx(['flex', className])}>{children}</footer>;
};

export default PopoverFooter;
