import React from 'react';
import { c } from 'ttag';

import { useSubscription, useUser } from '../../hooks';
import { Alert } from '../../components';

import MozillaInfoPanel from './MozillaInfoPanel';
import EditNews from './EditNews';

const NewsSection = () => {
    const [{ isManagedByMozilla } = {}] = useSubscription();
    const [{ isMember }] = useUser();

    if (isMember) {
        return null;
    }

    if (isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    return (
        <>
            <Alert>{c('Info')
                .t`To keep up with the latest development at Proton products, you can subscribe to our various emails and visit our blog from time to time.`}</Alert>
            <EditNews />
        </>
    );
};

export default NewsSection;
