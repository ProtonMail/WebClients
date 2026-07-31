import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcExclamationFilled } from '@proton/icons/icons/IcExclamationFilled';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsWaitingRoomRejected } from '@proton/meet/store/slices/waitingRoomSlice';

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
                <div
                    className="flex items-center justify-center shrink-0 rounded-full w-custom h-custom color-danger"
                    style={{
                        '--w-custom': '4rem',
                        '--h-custom': '4rem',
                        backgroundColor: 'color-mix(in srgb, var(--signal-danger) 15%, transparent)',
                    }}
                >
                    <IcExclamationFilled size={7} />
                </div>
            }
            title={c('Title').t`The host didn't admit you`}
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
