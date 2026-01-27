import type { ReactNode } from 'react';

export const Aside = ({ children }: { children: ReactNode }) => {
    return (
        <aside
            className="max-w-custom w-full flex flex-column gap-8 justify-start items-center md:items-start"
            style={{ '--max-w-custom': '27rem', position: 'sticky', top: '2rem' }}
        >
            {children}
        </aside>
    );
};
