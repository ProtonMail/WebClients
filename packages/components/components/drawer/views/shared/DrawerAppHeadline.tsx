import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props {
    children: ReactNode;
    className?: string;
}

const DrawerAppHeadline = ({ children, className }: Props) => {
    return <h3 className={clsx('flex-1 text-rg text-bold mt-1', className)}>{children}</h3>;
};

export default DrawerAppHeadline;
