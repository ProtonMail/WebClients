import React from 'react';
import { Button } from 'react-components';
import { c } from 'ttag';
import EmailUnsubscribeLayout from './EmailUnsubscribeLayout';

interface EmailUnsubscribedProps {
    categories: string[];
    onResubscribeClick: () => void;
    onManageClick: () => void;
    loading: boolean;
}

const EmailUnsubscribed = ({ categories, onResubscribeClick, onManageClick, loading }: EmailUnsubscribedProps) => {
    const allCategoriesExceptTheLastOne = categories.slice(0, -1).join(', ');

    const lastCategory = categories[categories.length - 1];

    const categoriesString =
        categories.length > 1
            ? c('Email Unsubscribe').t`${allCategoriesExceptTheLastOne} and ${lastCategory}`
            : lastCategory;

    const categoriesJsx = (
        <span key="bold" className="bold">
            {categoriesString}
        </span>
    );

    return (
        <EmailUnsubscribeLayout
            main={c('Email Unsubscribe').jt`You unsubscribed from ${categoriesJsx} emails.`}
            footer={
                <Button className="pm-button-blue" onClick={onResubscribeClick} loading={loading}>
                    {c('Action').t`Resubscribe`}
                </Button>
            }
            below={
                <Button onClick={onManageClick} className="pm-button--link">
                    {c('Action').t`Change other email subscriptions`}
                </Button>
            }
        />
    );
};

export default EmailUnsubscribed;
