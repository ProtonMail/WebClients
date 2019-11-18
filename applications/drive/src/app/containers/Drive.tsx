import React, { useEffect } from 'react';
import Page from '../components/page/Page';
import { useModals } from 'react-components';
import OnboardingModal from '../components/OnboardingModal/OnboardingModal';

function Drive() {
    const { createModal } = useModals();

    useEffect(() => {
        // TODO: don't show if user has drive share
        createModal(<OnboardingModal />);
    }, []);

    return <Page title="My files">Drive</Page>;
}

export default Drive;
