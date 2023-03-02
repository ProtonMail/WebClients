import { c } from 'ttag';

import Alert from './Alert';

const DoNotWindowOpenAlertError = () => (
    <Alert className="mb1" type="error">{c('Error')
        .t`The browser you are using does not allow the payment to be fully authorized. Please use a different browser or sign in via a computer.`}</Alert>
);

export default DoNotWindowOpenAlertError;
