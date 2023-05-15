import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props {
    className?: string;
    children: ReactNode;
}

export const ContactViewProperties = ({ className, children }: Props) => {
    return <div className={clsx(['border-bottom mb-2 pb-1', className])}>{children}</div>;
};
