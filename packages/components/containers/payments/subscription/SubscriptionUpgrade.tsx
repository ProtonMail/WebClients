import React from 'react';
import { c } from 'ttag';
import { FullLoader } from '../../../components';

const SubscriptionUpgrade = () => {
    return (
        <>
            <FullLoader size={80} className="center flex color-primary" />
            <h1 className="text-xl text-bold mb0">{c('Title').t`Processing`}</h1>
            <p className="text-center mt0-5">{c('Info')
                .t`Your account is being upgraded, this may take up to 30 seconds.`}</p>
            <p className="text-center color-weak pb2 mb2">{c('Info').t`Thank you for supporting our mission.`}</p>
        </>
    );
};

export default SubscriptionUpgrade;
