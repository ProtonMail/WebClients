import { ReactNode } from 'react';

import EllipsisLoader from './EllipsisLoader';

interface Props {
    children?: ReactNode;
    className?: string;
}

const TextLoader = ({ children, className }: Props) => {
    return (
        <p className={className}>
            {children}
            <EllipsisLoader />
        </p>
    );
};

export default TextLoader;
