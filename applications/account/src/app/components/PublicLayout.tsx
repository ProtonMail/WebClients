import * as React from 'react';
import { c } from 'ttag';
import protonLogoSvg from '@proton/styles/assets/img/shared/proton-logo.svg';

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
                <img
                    src={protonLogoSvg}
                    alt={c('Title').t`Proton Logo`}
                    className="public-layout--logo block mlauto mrauto mb2"
                />

                <div className="public-layout--main text-center">{main}</div>

                {footer && <div className="mt2">{footer}</div>}
            </PublicContainer>

            {below && <div className="mt2">{below}</div>}
        </div>
    );
};

export default PublicLayout;
