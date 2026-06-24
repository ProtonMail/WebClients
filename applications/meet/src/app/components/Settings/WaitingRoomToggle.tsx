import { useState } from 'react';

import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectSubscriptionStatus } from '@proton/meet/store/slices/userSlice';
import { useFlag } from '@proton/unleash/useFlag';

import { SettingsToggle } from './shared/SettingsToggle';

export const WaitingRoomToggle = () => {
    const isMeetWaitingRoomEnabled = useFlag('MeetWaitingRoom');

    const [isWaitingRoomEnabled, setIsWaitingRoomEnabled] = useState(false);
    const { isPaidUser } = useMeetSelector(selectSubscriptionStatus);

    const handleWaitingRoomToggle = () => {
        if (!isPaidUser) {
            return;
        }

        setIsWaitingRoomEnabled(!isWaitingRoomEnabled);
    };

    if (!isMeetWaitingRoomEnabled) {
        return null;
    }

    const getWaitingRoomDescription = () => {
        if (!isPaidUser) {
            return c('Action').t`Upgrade your plan to use waiting room in your next meeting.`;
        }

        if (isWaitingRoomEnabled) {
            return c('Action').t`Approve participants before they can join`;
        }

        return c('Action').t`Participants join the call directly`;
    };

    const getWaitingRoomToggleAriaLabel = () => {
        if (isWaitingRoomEnabled) {
            return c('Action').t`Disable waiting room`;
        }
        return c('Action').t`Enable waiting room`;
    };

    return (
        <SettingsToggle
            id="waiting-room"
            label={c('Action').t`Waiting room`}
            description={getWaitingRoomDescription()}
            onChange={handleWaitingRoomToggle}
            checked={isWaitingRoomEnabled}
            ariaLabel={getWaitingRoomToggleAriaLabel()}
            disabled={!isPaidUser}
        />
    );
};
