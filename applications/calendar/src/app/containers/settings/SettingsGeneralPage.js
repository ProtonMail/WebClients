import React from 'react';

import Main from '../../components/Main';
import TimeSection from './section/TimeSection';
import LayoutSection from './section/LayoutSection';
import { Loader } from 'react-components';

const SettingsGeneralPage = ({ calendarUserSettings }) => {
    if (!calendarUserSettings) {
        return (
            <Main className="p2">
                <Loader />
            </Main>
        );
    }

    return (
        <Main className="p2">
            <TimeSection calendarUserSettings={calendarUserSettings} />
            <LayoutSection calendarUserSettings={calendarUserSettings} />
        </Main>
    );
};

export default SettingsGeneralPage;
