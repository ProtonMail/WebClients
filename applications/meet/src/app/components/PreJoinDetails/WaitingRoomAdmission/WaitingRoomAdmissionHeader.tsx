import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { WaitingRoomAdmissionStatus, selectAdmissionStatus } from '@proton/meet/store/slices/waitingRoomSlice';

import { PrejoinDetailsHeaderShell } from '../shared/PrejoinDetailsHeaderShell';

const getTitle = (status: WaitingRoomAdmissionStatus) => {
    switch (status) {
        case WaitingRoomAdmissionStatus.HOST_NOT_STARTED:
        case WaitingRoomAdmissionStatus.AWAITING:
            return c('Title').t`Waiting for the host`;
        case WaitingRoomAdmissionStatus.EXPIRED:
            return c('Title').t`Join request expired`;
        default:
            return c('Title').t`Join meeting`;
    }
};

const getSubtitle = (status: WaitingRoomAdmissionStatus) => {
    switch (status) {
        case WaitingRoomAdmissionStatus.HOST_NOT_STARTED:
            return c('Info')
                .t`Waiting for the host to start. You'll join when the host starts the meeting and admits you.`;
        case WaitingRoomAdmissionStatus.AWAITING:
            return c('Info').t`Waiting for the host to admit you. The host has been notified that you're waiting.`;
        case WaitingRoomAdmissionStatus.EXPIRED:
            return c('Info').t`Join request expired. The host didn't admit you in time. Send a new request to join.`;
        default:
            return undefined;
    }
};

export const WaitingRoomAdmissionHeader = () => {
    const status = useMeetSelector(selectAdmissionStatus);

    return <PrejoinDetailsHeaderShell visibleOnMobile title={getTitle(status)} subtitle={getSubtitle(status)} />;
};
