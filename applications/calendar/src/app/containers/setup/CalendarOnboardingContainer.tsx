import CalendarContainerViewBlurred from '../calendar/CalendarContainerViewBlurred';
import CalendarOnboardingModal from '../../components/onboarding/CalendarOnboardingModal';

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
