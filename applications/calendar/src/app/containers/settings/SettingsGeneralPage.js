import React from 'react';

import Main from '../../components/Main';
import TimeSection from './section/TimeSection';
import LayoutSection from './section/LayoutSection';
import { Loader } from 'react-components';

const SettingsGeneralPage = ({ calendarSettings }) => {
    if (!calendarSettings) {
        return (
            <Main className="p2">
                <Loader />
            </Main>
        );
    }

    return (
        <Main className="p2">
            <TimeSection calendarSettings={calendarSettings} />
            <LayoutSection calendarSettings={calendarSettings} />
        </Main>
    );
};

export default SettingsGeneralPage;
