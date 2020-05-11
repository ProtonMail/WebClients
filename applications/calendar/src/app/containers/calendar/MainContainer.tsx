import React, { useState } from 'react';
import { useAddresses, useCalendars, useDelinquent, useUser } from 'react-components';

import { getSetupType, SETUP_TYPE } from '../setup/setupHelper';
import FreeContainer from '../setup/FreeContainer';
import WelcomeContainer from '../setup/WelcomeContainer';
import ResetContainer from '../setup/ResetContainer';
import MainContainerSetup from './MainContainerSetup';

const MainContainer = () => {
    const [addresses] = useAddresses();
    const [calendars] = useCalendars();
    const [user] = useUser();
    useDelinquent();

    const [setupType, setSetupType] = useState(() => getSetupType(calendars));

    if (user.isFree) {
        return <FreeContainer />;
    }

    if (setupType === SETUP_TYPE.WELCOME) {
        return <WelcomeContainer onDone={() => setSetupType(SETUP_TYPE.DONE)} />;
    }

    if (setupType === SETUP_TYPE.RESET) {
        return <ResetContainer calendars={calendars} onDone={() => setSetupType(SETUP_TYPE.DONE)} />;
    }

    return <MainContainerSetup addresses={addresses} calendars={calendars} />;
};

export default MainContainer;
