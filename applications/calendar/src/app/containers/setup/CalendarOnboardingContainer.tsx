import React, { useEffect } from 'react';
import { useModals } from '@proton/components';

import CalendarContainerViewBlurred from '../calendar/CalendarContainerViewBlurred';
import CalendarOnboardingModal from '../../components/onboarding/CalendarOnboardingModal';

interface Props {
    onDone: () => void;
}
const CalendarOnboardingContainer = ({ onDone }: Props) => {
    const { createModal } = useModals();

    useEffect(() => {
        createModal(<CalendarOnboardingModal onDone={onDone} />);
    }, []);

    return <CalendarContainerViewBlurred />;
};

export default CalendarOnboardingContainer;
