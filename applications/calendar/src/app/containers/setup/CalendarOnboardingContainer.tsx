import CalendarOnboardingModal from '../../components/onboarding/CalendarOnboardingModal';
import CalendarContainerViewBlurred from '../calendar/CalendarContainerViewBlurred';

interface Props {
    onDone: () => void;
}

const CalendarOnboardingContainer = ({ onDone }: Props) => {
    return (
        <>
            <CalendarContainerViewBlurred />
            <CalendarOnboardingModal open onDone={onDone} />
        </>
    );
};

export default CalendarOnboardingContainer;
