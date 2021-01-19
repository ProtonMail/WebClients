import React from 'react';
import { Button } from 'react-components';
import { c } from 'ttag';
import EmailUnsubscribeLayout from './EmailUnsubscribeLayout';

interface EmailUnsubscribedProps {
    categories: string[];
    onResubscribeClick: () => void;
    onManageClick: () => void;
}

const EmailUnsubscribed = ({ categories, onResubscribeClick, onManageClick }: EmailUnsubscribedProps) => {
    const allCategoriesExceptTheLastOne = categories.slice(0, -1);

    const lastCategory = categories[categories.length - 1];

    const categoriesString =
        categories.length > 1
            ? c('Email Unsubscribe').t`${allCategoriesExceptTheLastOne.join(', ')} and ${lastCategory}`
            : c('Email Unsubscribe').t`${lastCategory}`;

    const categoriesJsx = <span className="bold">{categoriesString}</span>;

    return (
        <EmailUnsubscribeLayout
            main={c('Email Unsubscribe').jt`You unsubscribed from ${categoriesJsx} emails.`}
            footer={
                <Button onClick={onResubscribeClick} className="pm-button--link">
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
