import React from 'react';
import { Button } from 'react-components';
import { c } from 'ttag';
import EmailUnsubscribeLayout from './EmailUnsubscribeLayout';

interface EmailResubscribedProps {
    categories: string[];
    onUnsubscribeClick: () => void;
    onManageClick: () => void;
    loading: boolean;
}

const EmailResubscribed = ({ categories, onUnsubscribeClick, onManageClick, loading }: EmailResubscribedProps) => {
    const allCategoriesExceptTheLastOne = categories.slice(0, -1).join(', ');

    const lastCategory = categories[categories.length - 1];

    const categoriesString =
        categories.length > 1
            ? c('Email Unsubscribe Categories').t`${allCategoriesExceptTheLastOne} and ${lastCategory}`
            : lastCategory;

    const categoriesJsx = (
        <span key="bold" className="bold">
            {categoriesString}
        </span>
    );

    return (
        <EmailUnsubscribeLayout
            main={c('Email Unsubscribe').jt`You resubscribed to ${categoriesJsx} emails.`}
            footer={
                <Button className="bl mauto" onClick={onUnsubscribeClick} loading={loading}>
                    {c('Action').t`Unsubscribe`}
                </Button>
            }
            below={
                <Button className="pm-button--link bl mauto" onClick={onManageClick}>
                    {c('Action').t`Change other email subscriptions`}
                </Button>
            }
        />
    );
};

export default EmailResubscribed;
