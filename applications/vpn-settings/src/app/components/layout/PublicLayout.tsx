import * as React from 'react';
import { PublicTopBanners } from '@proton/components';

interface Props {
    children?: React.ReactNode;
}

const PublicLayout = ({ children }: Props) => {
    return (
        <main className="main-full flex-no-min-children flex-column flex-nowrap reset4print">
            <PublicTopBanners />
            {children}
        </main>
    );
};

export default PublicLayout;
