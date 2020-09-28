import React, { useEffect } from 'react';
import { useModals } from 'react-components';
import CalendarContainerViewBlurred from '../calendar/CalendarContainerViewBlurred';
import CalendarOnboardingModalFree from '../../components/onboarding/CalendarOnboardingModalFree';

const CalendarFreeContainer = (props: any) => {
    const { createModal, hideModal } = useModals();

    useEffect(() => {
        const id = createModal(<CalendarOnboardingModalFree {...props} />);
        return () => {
            hideModal(id);
        };
    }, []);

    return <CalendarContainerViewBlurred />;
};

export default CalendarFreeContainer;
