import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props {
    className?: string;
    children: ReactNode;
}

const Text = ({ children, className }: Props) => {
    return <div className={clsx(['mb-6 color-weak text-break', className])}>{children}</div>;
};

export default Text;
