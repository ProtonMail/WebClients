import React, { useEffect } from 'react';
import { useModals } from 'react-components';

import DriveOnboardingModal from '../components/onboarding/DriveOnboardingModal';
import DriveContainerBlurred from './DriveContainerBlurred';

interface Props {
    onDone: () => void;
}
const OnboardingContainer = ({ onDone }: Props) => {
    const { createModal } = useModals();

    useEffect(() => {
        createModal(<DriveOnboardingModal onDone={onDone} />);
    }, []);

    return <DriveContainerBlurred />;
};

export default OnboardingContainer;
