import type { FC, PropsWithChildren } from 'react';

export const TwoColumns: FC<PropsWithChildren> = ({ children }) => {
    return <div className="flex flex-column md:flex-row my-10 lg:my-20 gap-x-8 gap-y-12 max-w-4/5">{children}</div>;
};
