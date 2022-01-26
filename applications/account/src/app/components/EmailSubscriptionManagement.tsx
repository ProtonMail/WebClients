import { EmailSubscriptionCheckboxes } from '@proton/components';
import { c } from 'ttag';
import protonLogoSvg from '@proton/styles/assets/img/shared/proton-logo.svg';

import PublicContainer from './PublicContainer';
import './PublicLayout.scss';

interface EmailSubscriptionManagementProps {
    News: number;
    disabled: boolean;
    onChange: (News: number) => void;
}

const EmailSubscriptionManagement = ({ News, disabled, onChange }: EmailSubscriptionManagementProps) => {
    return (
        <PublicContainer className="mrauto mlauto">
            <img
                src={protonLogoSvg}
                alt={c('Title').t`Proton Logo`}
                className="email-unsubscribe-layout--logo block mlauto mrauto mb2"
            />

            {c('Email Unsubscribe').jt`Which emails do you want to receive from Proton?`}

            <div className="mt2">
                <EmailSubscriptionCheckboxes News={News} disabled={disabled} onChange={onChange} />
            </div>
        </PublicContainer>
    );
};

export default EmailSubscriptionManagement;
