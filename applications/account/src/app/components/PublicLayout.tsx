import * as React from 'react';

import { ProtonLogo } from '@proton/components/components';

import PublicContainer from './PublicContainer';

import './PublicLayout.scss';

interface PublicLayoutProps {
    main: React.ReactNode;
    footer?: React.ReactNode;
    below?: React.ReactNode;
}

const PublicLayout = ({ main, footer, below }: PublicLayoutProps) => {
    return (
        <div className="flex flex-column flex-align-items-center">
            <PublicContainer>
                <ProtonLogo className="mb-8" />

                <div className="public-layout--main text-center">{main}</div>

                {footer && <div className="mt-8">{footer}</div>}
            </PublicContainer>

            {below && <div className="mt-8">{below}</div>}
        </div>
    );
};

export default PublicLayout;
