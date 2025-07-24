import type { FC, PropsWithChildren } from 'react';

type WrapperProps = {
    className?: string;
    minHeight: string;
};

export const Wrapper: FC<PropsWithChildren<WrapperProps>> = ({ children, minHeight, className }) => {
    return (
        <div
            className={`flex flex-column flex-nowrap min-h-custom justify-center ${className}`}
            style={{ '--min-h-custom': minHeight }}
        >
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-column md:flex-row flex-nowrap items-center justify-center w-full signup-layout-gap p-4">
                    {children}
                </div>
            </div>
        </div>
    );
};
