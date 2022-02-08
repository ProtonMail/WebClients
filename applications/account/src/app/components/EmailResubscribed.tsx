import { Button } from '@proton/components';
import { c } from 'ttag';

import EmailUnsubscribeCategories from './EmailUnsubscribeCategories';
import PublicLayout from './PublicLayout';

interface EmailResubscribedProps {
    categories: string[];
    onUnsubscribeClick: () => void;
    onManageClick: () => void;
    loading: boolean;
}

const EmailResubscribed = ({ categories, onUnsubscribeClick, onManageClick, loading }: EmailResubscribedProps) => {
    const categoriesJsx = <EmailUnsubscribeCategories categories={categories} />;

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
