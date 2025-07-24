import type { ReactNode } from 'react';

export const Wrapper = ({ children, minHeight }: { children: ReactNode; minHeight?: string }) => {
    return (
        <div
            className="flex flex-column flex-nowrap accountDetailsStep min-h-custom justify-center"
            style={{ '--min-h-custom': minHeight }}
        >
            <div className="flex items-center justify-center h-full">
                <div
                    className="flex flex-column md:flex-row flex-nowrap items-center justify-center w-full p-4 gap-4 md:gap-custom"
                    style={{ '--md-gap-custom': 'min(7vw, 10rem)' }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
};
