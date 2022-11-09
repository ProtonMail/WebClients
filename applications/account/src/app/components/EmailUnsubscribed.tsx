import { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';

import PublicLayout from './PublicLayout';

interface EmailUnsubscribedProps {
    categories: ReactNode;
    onResubscribeClick: () => void;
    onManageClick: () => void;
    loading: boolean;
}

const EmailUnsubscribed = ({
    categories: categoriesJsx,
    onResubscribeClick,
    onManageClick,
    loading,
}: EmailUnsubscribedProps) => {
    return (
        <PublicLayout
            main={c('Email Unsubscribe').jt`You unsubscribed from ${categoriesJsx} emails.`}
            footer={
                <Button color="norm" onClick={onResubscribeClick} loading={loading}>
                    {c('Action').t`Resubscribe`}
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

export default EmailUnsubscribed;
