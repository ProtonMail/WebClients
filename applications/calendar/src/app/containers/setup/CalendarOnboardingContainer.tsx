import CalendarOnboardingModal from '../../components/onboarding/CalendarOnboardingModal';
import DummyCalendarContainerView from '../calendar/DummyCalendarContainerView';

interface Props {
    onDone: () => void;
}

const CalendarOnboardingContainer = ({ onDone }: Props) => {
    return (
        <>
            <DummyCalendarContainerView />
            <CalendarOnboardingModal open onDone={onDone} />
        </>
    );
};

export default CalendarOnboardingContainer;
