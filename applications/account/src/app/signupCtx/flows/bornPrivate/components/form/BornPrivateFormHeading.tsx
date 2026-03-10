import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface FormHeadingProps {
    children: ReactNode;
    className?: string;
    as?: 'h1' | 'h2';
}

const BornPrivateFormHeading = ({ children, className, as: Tag = 'h2' }: FormHeadingProps) => {
    return <Tag className={clsx('m-0 text-4xl text-semibold', className)}>{children}</Tag>;
};

export default BornPrivateFormHeading;
