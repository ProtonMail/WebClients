import { useActiveBreakpoint } from '@proton/components/index';
import type { VIEWS } from '@proton/shared/lib/calendar/constants';

import CalendarOnboardingModal from '../../components/onboarding/CalendarOnboardingModal';
import DummyCalendarContainerView from '../calendar/DummyCalendarContainerView';

interface Props {
    onDone: () => void;
    drawerView?: VIEWS;
}

const CalendarOnboardingContainer = ({ onDone, drawerView }: Props) => {
    const { viewportWidth } = useActiveBreakpoint();

    return (
        <>
            <DummyCalendarContainerView drawerView={drawerView} isSmallViewport={viewportWidth['<=small']} />
            <CalendarOnboardingModal open onDone={onDone} />
        </>
    );
};

export default CalendarOnboardingContainer;
