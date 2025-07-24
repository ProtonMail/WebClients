import type { FC, PropsWithChildren } from 'react';

export const Main: FC<PropsWithChildren> = ({ children }) => (
    <main
        className="flex flex-column justify-center items-center w-full max-w-custom"
        style={{ '--max-w-custom': '29rem' }}
    >
        {children}
    </main>
);
