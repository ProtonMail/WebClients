import React from 'react';

import Main from '../components/Main';
import TimeSection from '../components/section/TimeSection';
import LayoutSection from '../components/section/LayoutSection';

const GeneralPage = () => {
    return (
        <Main className="p2">
            <TimeSection />
            <LayoutSection />
        </Main>
    );
};

export default GeneralPage;
