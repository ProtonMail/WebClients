import React from 'react';
import { Alert, Block } from 'react-components';
import { c } from 'ttag';

const OnboardingStepInfo = () => {
    const betaText = <strong key="title">{c('BetaText').t`ProtonDrive Beta`}</strong>;

    return (
        <Alert className="aligncenter">
            <Block>
                {c('Info')
                    .jt`${betaText} - the end to end encrypted and privacy focused cloud storage solution brought to you by Proton Technologies.`}
            </Block>
            <div>{c('Info').t`These 3 steps will help you to jump into storing your files online safely.`}</div>
        </Alert>
    );
};

export default OnboardingStepInfo;
