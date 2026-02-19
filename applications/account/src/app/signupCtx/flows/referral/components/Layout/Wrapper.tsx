import type { ReactNode } from 'react';

export const Wrapper = ({ children, marginTop = '0px' }: { children: ReactNode; marginTop?: string }) => {
    return (
        <div
            className="flex flex-column flex-nowrap accountDetailsStep md:mt-custom min-h-custom"
            style={{ '--md-mt-custom': marginTop, '--min-h-custom': `calc(100vh - 4.25rem - 4rem - ${marginTop})` }}
        >
            <div className="flex items-center justify-center h-full">
                <div
                    className="flex flex-column md:flex-row flex-nowrap items-center justify-center w-full p-4 md:px-8 gap-4 md:gap-custom"
                    style={{ '--md-gap-custom': 'min(7vw, 10rem)' }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
};
