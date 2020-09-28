import React, { useEffect } from 'react';
import { useModals } from 'react-components';
import DriveOnboardingModalNoAccess from '../../components/onboarding/DriveOnboardingModalNoAccess';
import DriveContainerBlurred from '../DriveContainerBlurred';

const NoAccessContainer = () => {
    const { createModal } = useModals();

    useEffect(() => {
        createModal(<DriveOnboardingModalNoAccess />);
    }, []);

    return <DriveContainerBlurred />;
};

export default NoAccessContainer;
