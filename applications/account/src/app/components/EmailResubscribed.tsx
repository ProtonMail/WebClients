import { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';

import PublicLayout from './PublicLayout';

interface EmailResubscribedProps {
    categories: ReactNode;
    onUnsubscribeClick: () => void;
    onManageClick: () => void;
    loading: boolean;
}

const EmailResubscribed = ({
    categories: categoriesJsx,
    onUnsubscribeClick,
    onManageClick,
    loading,
}: EmailResubscribedProps) => {
    return (
        <PublicLayout
            main={c('Email Unsubscribe').jt`You resubscribed to ${categoriesJsx} emails.`}
            footer={
                <Button onClick={onUnsubscribeClick} loading={loading}>
                    {c('Action').t`Unsubscribe`}
                </Button>
            }
            below={
                <Button onClick={onManageClick} shape="underline" color="norm">
                    {c('Action').t`Change other email subscriptions`}
                </Button>
            }
        />
    );
};

export default EmailResubscribed;
