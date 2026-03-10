import type { ReactNode } from 'react';

const BornPrivateAside = ({ children }: { children: ReactNode }) => {
    return (
        <aside
            className="w-custom w-full flex flex-column gap-8 justify-center items-center confirmation-two-column-aside"
            style={{ '--w-custom': '29rem' }}
        >
            {children}
        </aside>
    );
};

export default BornPrivateAside;
