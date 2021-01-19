import React from 'react';
import { Button } from 'react-components';
import { c } from 'ttag';
import EmailUnsubscribeLayout from './EmailUnsubscribeLayout';

interface EmailResubscribedProps {
    categories: string[];
    onUnsubscribeClick: () => void;
    onManageClick: () => void;
}

const EmailResubscribed = ({ categories, onUnsubscribeClick, onManageClick }: EmailResubscribedProps) => {
    const allCategoriesExceptTheLastOne = categories.slice(0, -1);

    const lastCategory = categories[categories.length - 1];

    const categoriesString =
        categories.length > 1
            ? c('Email Unsubscribe Categories').t`${allCategoriesExceptTheLastOne.join(', ')} and ${lastCategory}`
            : c('Email Unsubscribe Categories').t`${lastCategory}`;

    const categoriesJsx = <span className="bold">{categoriesString}</span>;

    return (
        <EmailUnsubscribeLayout
            main={c('Email Unsubscribe').jt`You resubscribed to ${categoriesJsx} emails.`}
            footer={
                <Button onClick={onUnsubscribeClick} className="pm-button--link bl mauto">
                    {c('Action').t`Unsubscribe`}
                </Button>
            }
            below={
                <Button onClick={onManageClick} className="pm-button--link bl mauto">
                    {c('Action').t`Change other email subscriptions`}
                </Button>
            }
        />
    );
};

export default EmailResubscribed;
