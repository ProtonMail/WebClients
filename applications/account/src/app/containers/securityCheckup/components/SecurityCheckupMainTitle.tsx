import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props {
    className?: string;
    children?: ReactNode;
    prefix?: ReactNode;
}

const SecurityCheckupMainTitle = ({ prefix, children, className }: Props) => {
    return (
        <div className="flex flex-nowrap items-center gap-4 mb-8">
            {prefix}
            <h1 className={clsx('text-2xl text-bold', className)}>{children}</h1>
        </div>
    );
};

export default SecurityCheckupMainTitle;
