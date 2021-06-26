import { c } from 'ttag';
import React from 'react';

import Alert from '../../../components/alert/Alert';

const AutoReplyFormPermanent = () => <Alert>{c('Info').t`Auto-reply is active until you turn it off.`}</Alert>;

export default AutoReplyFormPermanent;
