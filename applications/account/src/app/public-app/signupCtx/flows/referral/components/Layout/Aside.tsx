import type { ReactNode } from 'react';

export const Aside = ({ children }: { children: ReactNode }) => {
    return (
        <aside
            className="max-w-custom w-full flex flex-column gap-8 justify-center items-center"
            style={{ '--max-w-custom': '27rem' }}
        >
            {children}
        </aside>
    );
};
