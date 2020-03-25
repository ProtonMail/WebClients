import React, { useEffect } from 'react';
import { useModals } from 'react-components';

import WelcomeModal from './WelcomeModal';

import CalendarContainerViewBlurred from '../calendar/CalendarContainerViewBlurred';

interface Props {
    onDone: () => void;
}
const WelcomeContainer = ({ onDone }: Props) => {
    const { createModal } = useModals();

    useEffect(() => {
        createModal(<WelcomeModal onExit={onDone} />);
    }, []);

    return <CalendarContainerViewBlurred />;
};

export default WelcomeContainer;
