import { useState } from 'react';

import { c } from 'ttag';

import type { WaitingRoomState } from '@proton/shared/lib/interfaces/Meet';

import { ExpandOptionsButton } from '../../../atoms/ExpandOptionsButton/ExpandOptionsButton';
import { useNewPill } from '../../../atoms/NewPill/useNewPill';
import { WaitingRoomCard, type WaitingRoomChange } from './WaitingRoomCard/WaitingRoomCard';

export const MeetingOptions = ({
    namespace,
    onWaitingRoomChange,
    waitingRoom,
}: {
    namespace: string;
    onWaitingRoomChange: WaitingRoomChange;
    waitingRoom: WaitingRoomState;
}) => {
    const [showOptions, setShowOptions] = useState(false);

    const { isNew, markNewPillAsRead } = useNewPill(namespace);

    return (
        <>
            <ExpandOptionsButton
                containerClassName="mt-2"
                onClick={() => {
                    setShowOptions(!showOptions);
                    markNewPillAsRead();
                }}
                newPill={isNew}
            >
                {showOptions ? c('Action').t`Hide options` : c('Action').t`Show options`}
            </ExpandOptionsButton>
            {showOptions && <WaitingRoomCard waitingRoom={waitingRoom} onWaitingRoomChange={onWaitingRoomChange} />}
        </>
    );
};
