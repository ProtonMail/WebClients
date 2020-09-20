import { c } from 'ttag';
import React from 'react';

import Alert from '../../../components/alert/Alert';

const AutoReplyFormPermanent = () => {
    return (
        <>
            <Alert>{c('Info').t`Auto-reply is active until you turn it off.`}</Alert>
        </>
    );
};

AutoReplyFormPermanent.propTypes = {};

export default AutoReplyFormPermanent;
