import React from 'react';
import { Alert, Block } from 'react-components';
import { c } from 'ttag';

const OnboardingCompleteInfo = () => {
    const email = 'drive@protonmail.com';
    const emailLink = (
        <a href={`mailto:${email}`} title={email}>
            {email}
        </a>
    );
    return (
        <Alert className="aligncenter">
            <Block>{c('Info').t`Like the product? Can’t find something? Want to say hello?`}</Block>
            <Block>{c('Info').t`Tell us how you feel using ProtonDrive and help us build a better product.`}</Block>
            <div>{c('Info')
                .jt`Drop us an email via ${emailLink} or use the Report bug button in the top right bar and send your comments directly to our team.`}</div>
        </Alert>
    );
};

export default OnboardingCompleteInfo;
