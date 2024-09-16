import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { EmailSubscriptionToggles } from '@proton/components';
import type { NewsletterSubscriptionUpdateData } from '@proton/components/containers/account/EmailSubscriptionToggles';
import { BRAND_NAME, SSO_PATHS } from '@proton/shared/lib/constants';

import PublicFooter from './PublicFooter';
import PublicLayout from './PublicLayout';

interface EmailSubscriptionManagementProps {
    News: number;
    disabled: boolean;
    onChange: (data: NewsletterSubscriptionUpdateData) => void;
}

const EmailSubscriptionManagement = ({ News, disabled, onChange }: EmailSubscriptionManagementProps) => {
    return (
        <PublicLayout
            className="h-full"
            header={c('Email Unsubscribe').t`Email subscriptions`}
            main={
                <div>
                    <div className="text-center">
                        {c('Email Unsubscribe').t`Which emails do you want to receive from ${BRAND_NAME}?`}
                    </div>
                    <EmailSubscriptionToggles News={News} disabled={disabled} onChange={onChange} />
                </div>
            }
            footer={
                <ButtonLike fullWidth as="a" href={SSO_PATHS.SWITCH} target="_self">
                    {c('Action').t`Sign in`}
                </ButtonLike>
            }
            below={<PublicFooter />}
        />
    );
};

export default EmailSubscriptionManagement;
