import React from 'react';
import { c } from 'ttag';
import { Href } from '../../../components';

const RequestInvite = () => {
    return (
        <div className="mt0-5">
            <div>{c('Info')
                .t`If you are having trouble creating your account, please request an invitation and we will respond within one business day.`}</div>
            <Href url="https://protonmail.com/support-form">{c('Link').t`Request an invite`}</Href>
        </div>
    );
};

export default RequestInvite;
