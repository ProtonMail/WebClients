import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { EmailSubscriptionCheckboxes } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import PublicFooter from './PublicFooter';
import PublicLayout from './PublicLayout';

interface EmailSubscriptionManagementProps {
    News: number;
    disabled: boolean;
    onChange: (News: number) => void;
}

const EmailSubscriptionManagement = ({ News, disabled, onChange }: EmailSubscriptionManagementProps) => {
    return (
        <PublicLayout
            className="h100"
            header={c('Email Unsubscribe').t`Email subscriptions`}
            main={
                <div>
                    <div className="text-center">
                        {c('Email Unsubscribe').t`Which emails do you want to receive from ${BRAND_NAME}?`}
                    </div>
                    <EmailSubscriptionCheckboxes News={News} disabled={disabled} onChange={onChange} />
                </div>
            }
            footer={
                <ButtonLike fullWidth as="a" href="/switch" target="_self">
                    {c('Action').t`Sign in`}
                </ButtonLike>
            }
            below={<PublicFooter />}
        />
    );
};

export default EmailSubscriptionManagement;
