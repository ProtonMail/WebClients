import { c } from 'ttag';

import Alert from '@proton/components/components/alert/Alert';

const AutoReplyFormPermanent = () => (
    <Alert className="mb-4">{c('Info').t`Auto-reply is active until you turn it off.`}</Alert>
);

export default AutoReplyFormPermanent;
