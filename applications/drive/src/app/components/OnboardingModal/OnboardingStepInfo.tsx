import React from 'react';
import { Alert } from 'react-components';
import { c } from 'ttag';

const OnboardingStepInfo = () => {
    const betaText = <strong key="title">{c('BetaText').t`ProtonDrive Beta`}</strong>;

    return (
        <Alert>
            {c('Info')
                .jt`${betaText} - the end-to-end encrypted and privacy focused cloud storage solution brought to you by Proton. Start storing your files securely today!`}
        </Alert>
    );
};

export default OnboardingStepInfo;
