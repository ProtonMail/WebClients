import type { ReactNode } from 'react';

import { EllipsisLoader } from '../EllipsisLoader/EllipsisLoader';

interface Props {
    children?: ReactNode;
    className?: string;
}

export const TextLoader = ({ children, className }: Props) => {
    return (
        <p className={className}>
            {children}
            <EllipsisLoader />
        </p>
    );
};
