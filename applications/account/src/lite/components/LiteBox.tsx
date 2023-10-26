import { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    maxWidth?: number;
}

const LiteBox = ({ children, maxWidth = 52 }: Props) => {
    return (
        <div
            className="m-0 sm:m-4 p-4 sm:p-8 rounded sm:shadow-lifted bg-norm w-full max-w-custom"
            style={{ '--max-w-custom': `${maxWidth}rem` }}
        >
            {children}
        </div>
    );
};

export default LiteBox;
