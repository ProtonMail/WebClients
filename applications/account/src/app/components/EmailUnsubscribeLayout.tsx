import React from 'react';
import { c } from 'ttag';
import protonLogoSvg from 'design-system/assets/img/shared/proton-logo.svg';
import EmailUnsubscribeBorderedContainer from './EmailUnsubscribeBorderedContainer';
import './EmailUnsubscribeLayout.scss';

interface EmailUnsubscribeLayoutProps {
    main: React.ReactNode;
    footer: React.ReactNode;
    below?: React.ReactNode;
}

const EmailUnsubscribeLayout = ({ main, footer, below }: EmailUnsubscribeLayoutProps) => {
    return (
        <div className="flex flex-column flex-items-center">
            <EmailUnsubscribeBorderedContainer>
                <img
                    src={protonLogoSvg}
                    alt={c('Title').t`Proton Logo`}
                    className="email-unsubscribe-layout--logo bl mlauto mrauto mb2"
                />

                <div className="email-unsubscribe-layout--main aligncenter">{main}</div>

                <div className="mt2">{footer}</div>
            </EmailUnsubscribeBorderedContainer>

            {below && <div className="mt2">{below}</div>}
        </div>
    );
};

export default EmailUnsubscribeLayout;
