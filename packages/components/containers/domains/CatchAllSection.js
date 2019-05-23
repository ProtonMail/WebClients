import React from 'react';
import { c } from 'ttag';
import { SubTitle, Alert } from 'react-components';

const CatchAllSection = () => {
    return (
        <>
            <SubTitle>{c('Title').t`Catch all `}</SubTitle>
            <Alert learnMore="TODO">{c('Info')
                .t`To select the catch-all email address of a domain, open the action dropdown menu and click on Set catch-all`}</Alert>
        </>
    );
};

export default CatchAllSection;
