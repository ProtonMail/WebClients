import { c } from 'ttag';

import { EmailSubscriptionCheckboxes, ProtonLogo } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import PublicContainer from './PublicContainer';

interface EmailSubscriptionManagementProps {
    News: number;
    disabled: boolean;
    onChange: (News: number) => void;
}

const EmailSubscriptionManagement = ({ News, disabled, onChange }: EmailSubscriptionManagementProps) => {
    return (
        <PublicContainer className="mrauto mlauto">
            <ProtonLogo className="mb2" />

            {c('Email Unsubscribe').jt`Which emails do you want to receive from ${BRAND_NAME}?`}

            <div className="mt2">
                <EmailSubscriptionCheckboxes News={News} disabled={disabled} onChange={onChange} />
            </div>
        </PublicContainer>
    );
};

export default EmailSubscriptionManagement;
