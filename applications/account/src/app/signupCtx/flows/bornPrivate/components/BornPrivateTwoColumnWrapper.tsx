import type { ReactNode } from 'react';

const BornPrivateTwoColumnWrapper = ({ children }: { children: ReactNode }) => {
    return (
        <div className="flex flex-1 flex-column flex-nowrap justify-center confirmation-two-column-wrapper">
            <div className="flex items-center justify-center h-full">
                <div
                    className="flex sm:flex-row flex-nowrap items-center justify-center w-full lg:p-4 gap-4 md:gap-custom"
                    style={{ '--md-gap-custom': 'min(7vw, 10rem)' }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
};

export default BornPrivateTwoColumnWrapper;
