import type { ReactNode } from 'react';

const BornPrivateMain = ({ children }: { children: ReactNode }) => {
    return <main className="flex-1 flex flex-column *:min-size-auto flex-nowrap items-center w-full">{children}</main>;
};

export default BornPrivateMain;
