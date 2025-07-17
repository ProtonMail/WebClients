import type { ReactNode } from 'react';

export const Wrapper = ({ children, minHeight }: { children: ReactNode; minHeight?: string }) => {
    return (
        <div
            className="flex flex-column flex-nowrap accountDetailsStep min-h-custom justify-center"
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
