import type { ReactNode } from 'react';

import './BornPrivateLayout.scss';

const BornPrivateLayout = ({ children }: { children: ReactNode }) => {
    return (
        <div className="born-private-reservation-main-container mx-auto flex flex-nowrap flex-column *:min-size-auto h-full relative px-8 lg:px-12">
            {children}
        </div>
    );
};

export default BornPrivateLayout;
