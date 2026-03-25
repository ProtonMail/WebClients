import type { ReactNode } from 'react';

export const Main = ({ children }: { children: ReactNode }) => {
    return (
        <main
            className="flex flex-column justify-center items-center w-full max-w-custom z-1"
            style={{ '--max-w-custom': '28rem' }}
        >
            {children}
        </main>
    );
};
