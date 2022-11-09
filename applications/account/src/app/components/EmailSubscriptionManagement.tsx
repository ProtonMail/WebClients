import { c } from 'ttag';

import { EmailSubscriptionCheckboxes } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import PublicLayout from './PublicLayout';

interface EmailSubscriptionManagementProps {
    News: number;
    disabled: boolean;
    onChange: (News: number) => void;
}

const EmailSubscriptionManagement = ({ News, disabled, onChange }: EmailSubscriptionManagementProps) => {
    const signIn = (
        <a key="1" href="/switch" target="_self">
            {c('Recovery Email').t`sign in`}
        </a>
    );
    return (
        <PublicLayout
            main={c('Email Unsubscribe').jt`Which emails do you want to receive from ${BRAND_NAME}?`}
            footer={<EmailSubscriptionCheckboxes News={News} disabled={disabled} onChange={onChange} />}
            below={c('Recovery Email').jt`Back to ${signIn}.`}
        />
    );
};

export default EmailSubscriptionManagement;
