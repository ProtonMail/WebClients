import DriveOnboardingModal from '../components/onboarding/DriveOnboardingModal';
import DriveDummyContainer from './DriveDummyContainer';

interface Props {
    onDone: () => void;
}

const OnboardingContainer = ({ onDone }: Props) => {
    return (
        <>
            <DriveDummyContainer />
            <DriveOnboardingModal open onDone={onDone} />
        </>
    );
};
export default OnboardingContainer;
