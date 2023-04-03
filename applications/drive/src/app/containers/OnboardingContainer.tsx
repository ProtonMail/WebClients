import DriveOnboardingModal from '../components/modals/DriveOnboardingModal';
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
