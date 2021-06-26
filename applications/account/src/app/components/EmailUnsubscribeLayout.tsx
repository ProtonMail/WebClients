import React from 'react';
import { c } from 'ttag';
import protonLogoSvg from '@proton/styles/assets/img/shared/proton-logo.svg';
import EmailUnsubscribeBorderedContainer from './EmailUnsubscribeBorderedContainer';
import './EmailUnsubscribeLayout.scss';

interface EmailUnsubscribeLayoutProps {
    main: React.ReactNode;
    footer: React.ReactNode;
    below?: React.ReactNode;
}

const EmailUnsubscribeLayout = ({ main, footer, below }: EmailUnsubscribeLayoutProps) => {
    return (
        <div className="flex flex-column flex-align-items-center">
            <EmailUnsubscribeBorderedContainer>
                <img
                    src={protonLogoSvg}
                    alt={c('Title').t`Proton Logo`}
                    className="email-unsubscribe-layout--logo block mlauto mrauto mb2"
                />

                <div className="email-unsubscribe-layout--main text-center">{main}</div>

                <div className="mt2">{footer}</div>
            </EmailUnsubscribeBorderedContainer>

            {below && <div className="mt2">{below}</div>}
        </div>
    );
};

export default EmailUnsubscribeLayout;
