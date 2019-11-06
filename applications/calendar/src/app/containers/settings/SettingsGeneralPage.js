import React from 'react';

import Main from '../../components/Main';
import TimeSection from './section/TimeSection';
import LayoutSection from './section/LayoutSection';

const SettingsGeneralPage = () => {
    return (
        <Main className="p2">
            <TimeSection />
            <LayoutSection />
        </Main>
    );
};

export default SettingsGeneralPage;
