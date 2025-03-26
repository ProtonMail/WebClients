import type { MutableRefObject } from 'react';

import type { VIEWS } from '@proton/shared/lib/calendar/constants';

import DummyCalendarContainerView from '../calendar/DummyCalendarContainerView';
import UnlockCalendarsModal from './UnlockCalendarsModal';
import type { CalendarsToAct } from './helper';

interface Props {
    calendarsToAct: CalendarsToAct;
    onDone: () => void;
    drawerView?: VIEWS;
    hasReactivatedCalendarsRef: MutableRefObject<boolean>;
}

const UnlockCalendarsContainer = ({ calendarsToAct, onDone, drawerView, hasReactivatedCalendarsRef }: Props) => {
    return (
        <>
            <UnlockCalendarsModal
                calendarsToAct={calendarsToAct}
                unlockAll={calendarsToAct.info.unlockAll}
                hasReactivatedCalendarsRef={hasReactivatedCalendarsRef}
                onDone={onDone}
            />
            <DummyCalendarContainerView drawerView={drawerView} />
        </>
    );
};

export default UnlockCalendarsContainer;
