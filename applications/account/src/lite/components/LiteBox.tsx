import { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

const LiteBox = ({ children }: Props) => {
    return (
        <div className="flex flex-justify-center flex-align-items-center h-full">
            <div
                className="p-4 sm:p-14 rounded shadow-lifted on-tiny-mobile-no-box-shadow bg-norm w-full max-w-custom"
                style={{ '--max-w-custom': '52rem' }}
            >
                {children}
            </div>
        </div>
    );
};

export default LiteBox;
