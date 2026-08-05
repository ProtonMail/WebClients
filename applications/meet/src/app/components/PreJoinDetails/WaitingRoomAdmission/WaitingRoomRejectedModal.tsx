import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsWaitingRoomRejected } from '@proton/meet/store/slices/waitingRoomSlice';
import warningIcon from '@proton/styles/assets/img/meet/warning-icon.svg';

import { useWaitingRoomContext } from '../../../contexts/WaitingRoomContext';
import { CTAModalShell } from '../../AnonymousModal/shared/CTAModalShell';

export const WaitingRoomRejectedModal = () => {
    const isRejected = useMeetSelector(selectIsWaitingRoomRejected);
    const { leaveWaitingRoom, retryWaitingRoom } = useWaitingRoomContext();

    return (
        <CTAModalShell
            open={isRejected}
            onClose={leaveWaitingRoom}
            icon={
                <img
                    className="mx-auto w-custom h-custom"
                    src={warningIcon}
                    alt=""
                    style={{
                        '--w-custom': '5rem',
                        '--h-custom': '5rem',
                    }}
                />
            }
            title={c('Title').t`The host didn't admit you`}
            headerClassName="pt-10"
            titleClassName="text-semibold"
            subtitle={c('Info')
                .t`You weren't admitted to this meeting. You can try joining again if you think this was a mistake.`}
            actions={
                <Button size="large" className="secondary w-full rounded-full" onClick={retryWaitingRoom}>
                    {c('Action').t`Try again`}
                </Button>
            }
        />
    );
};
