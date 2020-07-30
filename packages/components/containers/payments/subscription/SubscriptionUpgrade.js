import React from 'react';
import { c } from 'ttag';
import { FullLoader } from 'react-components';

const SubscriptionUpgrade = () => {
    return (
        <>
            <p className="aligncenter mb3">{c('Info')
                .t`Your account is being upgraded, this may take up to 30 seconds.`}</p>
            <FullLoader color="pm-primary" size="80" className="center flex" />
            <p className="aligncenter mt3 pb2 mb2">{c('Info').t`Thank you for supporting our mission.`}</p>
        </>
    );
};

export default SubscriptionUpgrade;
