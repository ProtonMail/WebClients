import React from 'react';
import { c } from 'ttag';
import { Alert } from 'react-components';

const Cash = () => (
    <Alert>{c('Info for cash payment method')
        .t`To pay via Cash, please email us at contact@protonmail.com for instructions.`}</Alert>
);

export default Cash;
