import React from 'react';
import { Alert, Block } from 'react-components';
import { c } from 'ttag';

const OnboardingCompleteInfo = () => {
    const email = 'drive@protonmail.com';
    const emailLink = (
        <a key="emailLink" href={`mailto:${email}`} title={email}>
            {email}
        </a>
    );
    return (
        <>
            <Block>
                <h4>{c('Info').t`Can’t find something? Want to say hello?`}</h4>
            </Block>
            <Alert>
                <div>{c('Info').t`Tell us how you feel using ProtonDrive and help us build a better product.`}</div>
                <div>{c('Info')
                    .jt`Drop us an email at ${emailLink} or use the Report bug button at the top right corner and send your comments directly to our team.`}</div>
            </Alert>
        </>
    );
};

export default OnboardingCompleteInfo;
