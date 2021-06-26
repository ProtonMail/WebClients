import React from 'react';
import { c } from 'ttag';
import { Icon, Alert } from '../../components';

const MozillaInfoPanel = () => {
    return (
        <Alert learnMore="https://support.mozilla.org/en-US/kb/protonvpn" type="warning">
            <Icon name="attention" />
            {c('Info').t`Your subscription is managed by Mozilla. Please contact Mozilla support.`}
        </Alert>
    );
};

export default MozillaInfoPanel;
