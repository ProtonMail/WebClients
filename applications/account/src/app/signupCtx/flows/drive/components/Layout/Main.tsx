import type { ReactNode } from 'react';

export const Main = ({ children }: { children: ReactNode }) => {
    return (
        <main
            className="flex flex-column justify-center items-center w-full max-w-custom"
            style={{ '--max-w-custom': '29rem' }}
        >
            {children}
        </main>
    );
};
