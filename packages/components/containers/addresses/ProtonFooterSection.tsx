import React from 'react';
import { c } from 'ttag';

import { Row, Label, Alert } from '../../components';
import { useMailSettings } from '../../hooks';
import PMSignatureField from './PMSignatureField';

const ProtonFooterSection = () => {
    const [mailSettings] = useMailSettings();
    const isMandatory = mailSettings?.PMSignature === 2;
    return (
        <>
            {isMandatory ? (
                <Alert>{c('Info')
                    .t`A paid plan is required to turn off the ProtonMail signature. Paid plan revenue allows us to continue supporting free accounts.`}</Alert>
            ) : null}
            <Row>
                <Label htmlFor="pmSignatureToggle">{c('Label').t`ProtonMail signature`}</Label>
                <PMSignatureField id="pmSignatureToggle" mailSettings={mailSettings} />
            </Row>
        </>
    );
};

export default ProtonFooterSection;
