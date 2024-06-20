import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props {
    children?: ReactNode;
    className?: string;
}

const Block = ({ children, className = '' }: Props) => {
    return <div className={clsx(['mb-4', className])}>{children}</div>;
};

export default Block;
