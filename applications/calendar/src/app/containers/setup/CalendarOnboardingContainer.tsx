import type { VIEWS } from '@proton/shared/lib/calendar/constants';

import CalendarOnboardingModal from '../../components/onboarding/CalendarOnboardingModal';
import DummyCalendarContainerView from '../calendar/DummyCalendarContainerView';

interface Props {
    onDone: () => void;
    drawerView?: VIEWS;
}

const CalendarOnboardingContainer = ({ onDone, drawerView }: Props) => {
    return (
        <>
            <DummyCalendarContainerView drawerView={drawerView} />
            <CalendarOnboardingModal open onDone={onDone} />
        </>
    );
};

export default CalendarOnboardingContainer;
