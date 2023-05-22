import { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';

import PublicFooter from './PublicFooter';
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
            className="h100"
            header={c('Email Unsubscribe').t`Email subscriptions`}
            main={
                <div className="text-center">
                    {c('Email Unsubscribe').jt`You resubscribed to ${categoriesJsx} emails.`}
                </div>
            }
            footer={
                <>
                    <Button className="mb-1" fullWidth onClick={onUnsubscribeClick} loading={loading}>
                        {c('Action').t`Unsubscribe`}
                    </Button>
                    <Button fullWidth onClick={onManageClick} shape="ghost" color="norm">
                        {c('Action').t`Change other email subscriptions`}
                    </Button>
                </>
            }
            below={<PublicFooter />}
        />
    );
};

export default EmailResubscribed;
