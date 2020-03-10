import React from 'react';
import { c } from 'ttag';
import { Alert, Loader } from 'react-components';

const Upgrading = () => {
    return (
        <div className="mb2">
            <Alert>{c('Info').t`Your account is being upgraded, this may take up to 30 seconds.`}</Alert>
            <Loader size="medium" />
        </div>
    );
};

export default Upgrading;
