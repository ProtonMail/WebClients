import React from 'react';
import { c } from 'ttag';
import { Alert } from 'react-components';

const CatchAllSection = () => {
    return (
        <Alert learnMore="https://protonmail.com/support/knowledge-base/catch-all/">{c('Info')
            .t`To select the catch-all email address of a domain, open the action dropdown menu and click on Set catch-all`}</Alert>
    );
};

export default CatchAllSection;
