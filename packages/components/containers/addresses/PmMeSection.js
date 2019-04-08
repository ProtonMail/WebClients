import React from 'react';
import { c } from 'ttag';
import { SubTitle } from 'react-components';
import PmMePanel from './PmMePanel';

const PmMeSection = () => {
    return (
        <>
            <SubTitle>{c('Title').t`Short domain (@pm.me)`}</SubTitle>
            <PmMePanel />
        </>
    );
};

export default PmMeSection;
