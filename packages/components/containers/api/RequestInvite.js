import React from 'react';
import { Alert, Href } from 'react-components';
import { c } from 'ttag';

const RequestInvite = () => {
    return (
        <Alert>
            <div>{c('Info')
                .t`If you are having trouble creating your account, please request an invitation and we will respond within one business day.`}</div>
            <Href target="_self" url="https://protonmail.com/support-form">{c('Link').t`Request an invite`}</Href>
        </Alert>
    );
};

export default RequestInvite;
