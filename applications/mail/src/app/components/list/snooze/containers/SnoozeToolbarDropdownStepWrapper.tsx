import type { MouseEvent } from 'react';
import { useMemo } from 'react';

import { useUser } from '@proton/account/user/hooks';

import useSnooze from '../../../../hooks/actions/useSnooze';
import { useGetElementsFromIDs } from '../../../../hooks/mailbox/useElements';
import { SOURCE_ACTION } from '../../list-telemetry/useListTelemetry';
import SnoozeCustomTime from '../components/SnoozeCustomTime';
import SnoozeDurationSelection from '../components/SnoozeDurationSelection';
import { type SNOOZE_DURATION } from '../constant';

export const SnoozeToolbarDropdownStepWrapperProps = {
    className: 'min-w-custom h-auto',
    style: { '--min-w-custom': '20rem', width: 'min-content' },
};

interface Props {
    onClose: () => void;
    onLock: (lock: boolean) => void;
    selectedIDs: string[];
    displayUpsellModal: () => void;
}

const SnoozeToolbarDropdownStepWrapper = ({ onClose, onLock, selectedIDs, displayUpsellModal }: Props) => {
    const [{ hasPaidMail }] = useUser();
    const getElementsFromIDs = useGetElementsFromIDs();
    const elements = useMemo(() => getElementsFromIDs(selectedIDs), [selectedIDs]);

    const { canUnsnooze, snooze, handleCustomClick, snoozeState, unsnooze, handleClose } = useSnooze();

    const handleSnooze = (event: MouseEvent, duration: SNOOZE_DURATION, snoozeTime?: Date) => {
        event.stopPropagation();
        void snooze({ elements, duration, snoozeTime }, SOURCE_ACTION.TOOLBAR);
        onClose();
    };

    const handleCustom = (event: MouseEvent) => {
        event.stopPropagation();
        if (hasPaidMail) {
            handleCustomClick();
            return;
        }
        onClose();
        displayUpsellModal();
    };

    const handleUnsnoozeClick = (event: MouseEvent) => {
        event.stopPropagation();
        void unsnooze(elements, SOURCE_ACTION.TOOLBAR);
        onClose();
    };

    const closeDropdown = () => {
        handleClose();
        onClose();
    };

    return (
        <>
            {snoozeState === 'snooze-selection' && (
                <SnoozeDurationSelection
                    handleUnsnoozeClick={handleUnsnoozeClick}
                    handleCustomClick={handleCustom}
                    handleSnooze={handleSnooze}
                    canUnsnooze={canUnsnooze}
                />
            )}
            {snoozeState === 'custom-snooze' && (
                <SnoozeCustomTime
                    handleSnooze={handleSnooze}
                    onClose={closeDropdown}
                    onLock={onLock}
                    element={elements[0]}
                />
            )}
        </>
    );
};

export default SnoozeToolbarDropdownStepWrapper;
