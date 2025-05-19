import type { FC, PropsWithChildren } from 'react';

export const DualPaneSidebar: FC<PropsWithChildren> = ({ children }) => (
    <div
        className="relative flex w-full max-w-custom h-full flex-column flex-nowrap justify-start items-stretch flex-1"
        style={{ '--max-w-custom': '22.5rem' }}
    >
        {children}
    </div>
);

export default DualPaneSidebar;
