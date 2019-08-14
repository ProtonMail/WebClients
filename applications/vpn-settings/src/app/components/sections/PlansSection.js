import React from 'react';
import { SubTitle } from 'react-components';
import { c } from 'ttag';

const PlansSection = () => {
    return (
        <>
            <SubTitle>{c('Title').t`VPN plans and prices`}</SubTitle>
        </>
    );
};

export default PlansSection;
