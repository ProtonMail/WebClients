import type { ReactNode } from 'react';

interface ModalSection {
    header: string;
    children: ReactNode;
}
export const ModalSectionHeader = ({ header, children }: ModalSection) => {
    return (
        <>
            <h3 className="text-center mt-6 mb-2 text-semibold">{header}</h3>
            <p className="mt-1 mb-6 color-weak text-center">{children}</p>
        </>
    );
};
