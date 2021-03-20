import React from 'react';
import { Button } from 'react-components';
import { c } from 'ttag';
import EmailUnsubscribeCategories from './EmailUnsubscribeCategories';
import EmailUnsubscribeLayout from './EmailUnsubscribeLayout';

interface EmailUnsubscribedProps {
    categories: string[];
    onResubscribeClick: () => void;
    onManageClick: () => void;
    loading: boolean;
}

const EmailUnsubscribed = ({ categories, onResubscribeClick, onManageClick, loading }: EmailUnsubscribedProps) => {
    const categoriesJsx = <EmailUnsubscribeCategories categories={categories} />;

    return (
        <EmailUnsubscribeLayout
            main={c('Email Unsubscribe').jt`You unsubscribed from ${categoriesJsx} emails.`}
            footer={
                <Button color="norm" onClick={onResubscribeClick} loading={loading}>
                    {c('Action').t`Resubscribe`}
                </Button>
            }
            below={
                <Button onClick={onManageClick} shape="link" color="norm">
                    {c('Action').t`Change other email subscriptions`}
                </Button>
            }
        />
    );
};

export default EmailUnsubscribed;
