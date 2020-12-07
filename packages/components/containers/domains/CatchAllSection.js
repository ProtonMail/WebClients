import React from 'react';
import { c } from 'ttag';
import { Alert } from '../../components';

const CatchAllSection = () => {
    return (
        <Alert learnMore="https://protonmail.com/support/knowledge-base/catch-all/">{c('Info')
            .t`Catch-All provides ProtonMail Custom Domain users the option to receive all mail sent to their domain, even if it was sent to an email address that has not been set up within their account. To set a catch-all email address, open the dropdown action menu of your custom domain and click on Set catch-all.`}</Alert>
    );
};

export default CatchAllSection;
