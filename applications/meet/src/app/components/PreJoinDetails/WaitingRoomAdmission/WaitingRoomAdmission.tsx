import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { WaitingRoomAdmissionStatus, selectAdmissionStatus } from '@proton/meet/store/slices/waitingRoomSlice';

import { useWaitingRoomContext } from '../../../contexts/WaitingRoomContext';
import { PreJoinDetailsShell } from '../shared/PreJoinDetailsShell';
import { WaitingRoomAdmissionCounter } from './WaitingRoomAdmissionCountdown';
import { WaitingRoomAdmissionHeader } from './WaitingRoomAdmissionHeader';

const Spinner = () => (
    <CircleLoader
        className="color-primary w-custom h-custom"
        style={{ '--w-custom': '5.3rem', '--h-custom': '5.3rem', '--stroke-width': 1.3 }}
    />
);

export const WaitingRoomAdmission = () => {
    const status = useMeetSelector(selectAdmissionStatus);
    const { leaveWaitingRoom, retryWaitingRoom } = useWaitingRoomContext();

    if (
        status !== WaitingRoomAdmissionStatus.HOST_NOT_STARTED &&
        status !== WaitingRoomAdmissionStatus.AWAITING &&
        status !== WaitingRoomAdmissionStatus.EXPIRED
    ) {
        return null;
    }

    const isExpired = status === WaitingRoomAdmissionStatus.EXPIRED;

    const action = isExpired ? (
        <Button key="try-again" size="large" color="norm" className="w-full rounded-full" onClick={retryWaitingRoom}>
            {c('Action').t`Try again`}
        </Button>
    ) : (
        <Button key="leave" size="large" className="secondary w-full rounded-full" onClick={leaveWaitingRoom}>
            {c('Action').t`Leave`}
        </Button>
    );

    return (
        <PreJoinDetailsShell
            preHeader={status === WaitingRoomAdmissionStatus.AWAITING && <WaitingRoomAdmissionCounter />}
            header={<WaitingRoomAdmissionHeader />}
            actions={[action]}
            loading={false}
        >
            <div className="flex flex-column items-center gap-4 w-full pb-8">{!isExpired && <Spinner />}</div>
        </PreJoinDetailsShell>
    );
};
