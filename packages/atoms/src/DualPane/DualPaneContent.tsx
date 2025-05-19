import type { FC, PropsWithChildren } from 'react';

export const DualPaneContent: FC<PropsWithChildren> = ({ children }) => {
    return (
        <div
            className="w-custom max-w-custom h-full shrink-0 bg-norm border-left border-norm"
            style={{ '--w-custom': '59.67%', '--max-w-custom': '30rem' }}
        >
            {children}
        </div>
    );
};

export default DualPaneContent;
