import React, { useRef } from 'react';
import { MainAreaContext } from 'react-components';

interface Props {
    children: React.ReactNode;
}

const PublicLayout = ({ children }: Props) => {
    const mainAreaRef = useRef<HTMLElement>(null);

    return (
        <main ref={mainAreaRef} className="main-full flex flex-column flex-nowrap reset4print">
            <MainAreaContext.Provider value={mainAreaRef}>{children}</MainAreaContext.Provider>
        </main>
    );
};

export default PublicLayout;
