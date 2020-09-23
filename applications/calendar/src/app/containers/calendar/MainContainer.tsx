import React, { useMemo, useState } from 'react';
import { ErrorBoundary, useAddresses, useCalendars, useUser } from 'react-components';

import { getSetupType, SETUP_TYPE } from '../setup/setupHelper';
import FreeContainer from '../setup/FreeContainer';
import WelcomeContainer from '../setup/WelcomeContainer';
import ResetContainer from '../setup/ResetContainer';
import MainContainerSetup from './MainContainerSetup';

const MainContainer = () => {
    const [addresses] = useAddresses();
    const [calendars] = useCalendars();
    const [user] = useUser();

    const memoedCalendars = useMemo(() => calendars || [], [calendars]);
    const memoedAddresses = useMemo(() => addresses || [], [addresses]);

    const [setupType, setSetupType] = useState(() => getSetupType(memoedCalendars));

    if (user.isFree) {
        return <FreeContainer />;
    }

    if (setupType === SETUP_TYPE.WELCOME) {
        return <WelcomeContainer onDone={() => setSetupType(SETUP_TYPE.DONE)} />;
    }

    if (setupType === SETUP_TYPE.RESET) {
        return <ResetContainer calendars={memoedCalendars} onDone={() => setSetupType(SETUP_TYPE.DONE)} />;
    }

    return <MainContainerSetup addresses={memoedAddresses} calendars={memoedCalendars} />;
};

const WrappedMainContainer = () => {
    return (
        <ErrorBoundary>
            <MainContainer />
        </ErrorBoundary>
    );
};

export default WrappedMainContainer;
