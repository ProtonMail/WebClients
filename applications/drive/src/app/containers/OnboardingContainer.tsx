import DriveOnboardingModal from '../components/onboarding/DriveOnboardingModal';
import DriveContainerBlurred from './DriveContainerBlurred';

interface Props {
    onDone: () => void;
}

const OnboardingContainer = ({ onDone }: Props) => {
    return (
        <>
            <DriveContainerBlurred />
            <DriveOnboardingModal open onDone={onDone} />
        </>
    );
};
export default OnboardingContainer;
