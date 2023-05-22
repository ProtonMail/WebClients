import { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';

import PublicFooter from './PublicFooter';
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
            className="h100"
            header={c('Email Unsubscribe').t`Email subscriptions`}
            main={
                <div className="text-center">
                    {c('Email Unsubscribe').jt`You unsubscribed from ${categoriesJsx} emails.`}
                </div>
            }
            footer={
                <>
                    <Button className="mb-1" fullWidth color="norm" onClick={onResubscribeClick} loading={loading}>
                        {c('Action').t`Resubscribe`}
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

export default EmailUnsubscribed;
