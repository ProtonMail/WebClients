import { c } from 'ttag';

import useLoading from '@proton/hooks/useLoading';
import { useIsWaitingRoomCreationEnabled } from '@proton/meet/hooks/useWaitingRoomFlags';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectWaitingRoomSetting } from '@proton/meet/store/slices/settings';
import { selectSubscriptionStatus } from '@proton/meet/store/slices/userSlice';

import { SettingToggle } from '../../atoms/SettingToggle/SettingToggle';
import { useWaitingRoomContext } from '../../contexts/WaitingRoomContext';

export const WaitingRoomToggle = () => {
    const isWaitingRoomCreationEnabled = useIsWaitingRoomCreationEnabled();

    const { toggleWaitingRoom } = useWaitingRoomContext();

    const { isPaidUser } = useMeetSelector(selectSubscriptionStatus);
    const waitingRoomSetting = useMeetSelector(selectWaitingRoomSetting);
    const [loading, withLoading] = useLoading();

    const handleWaitingRoomToggle = () => {
        if (!isPaidUser) {
            return;
        }

        void withLoading(toggleWaitingRoom(!waitingRoomSetting));
    };

    // Allow disabling the waiting room if creation is not enabled, remove all the condition when cleaning up isWaitingRoomCreationEnabled
    if (!isWaitingRoomCreationEnabled && !waitingRoomSetting) {
        return null;
    }

    const getWaitingRoomDescription = () => {
        if (!isPaidUser) {
            return c('Action').t`Upgrade your plan to use waiting room in your next meeting.`;
        }

        if (waitingRoomSetting) {
            return c('Action').t`Approve participants before they can join`;
        }

        return c('Action').t`Participants join the call directly`;
    };

    const getWaitingRoomToggleAriaLabel = () => {
        if (waitingRoomSetting) {
            return c('Action').t`Disable waiting room`;
        }
        return c('Action').t`Enable waiting room`;
    };

    return (
        <SettingToggle
            id="waiting-room"
            label={c('Action').t`Waiting room`}
            description={getWaitingRoomDescription()}
            onChange={handleWaitingRoomToggle}
            checked={waitingRoomSetting}
            ariaLabel={getWaitingRoomToggleAriaLabel()}
            disabled={!isPaidUser}
            loading={loading}
        />
    );
};
