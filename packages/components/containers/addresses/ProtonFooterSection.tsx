import React from 'react';
import { c } from 'ttag';

import { Row, Label } from '../../components';
import PMSignatureField from './PMSignatureField';

const ProtonFooterSection = () => {
    return (
        <Row>
            <Label htmlFor="pmSignatureToggle">{c('Label').t`ProtonMail signature`}</Label>
            <PMSignatureField id="pmSignatureToggle" />
        </Row>
    );
};

export default ProtonFooterSection;
