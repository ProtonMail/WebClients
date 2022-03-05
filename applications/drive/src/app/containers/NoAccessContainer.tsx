import DriveOnboardingModalNoAccess from '../components/onboarding/DriveOnboardingModalNoAccess';
import DriveOnboardingModalNoBeta from '../components/onboarding/DriveOnboardingModalNoBeta';
import DriveContainerBlurred from './DriveContainerBlurred';

interface Props {
    reason: 'notpaid' | 'notbeta';
}

const NoAccessContainer = ({ reason }: Props) => {
    return (
        <>
            <DriveContainerBlurred />
            {reason === 'notbeta' ? <DriveOnboardingModalNoBeta open /> : <DriveOnboardingModalNoAccess open />}
        </>
    );
};

export default NoAccessContainer;
