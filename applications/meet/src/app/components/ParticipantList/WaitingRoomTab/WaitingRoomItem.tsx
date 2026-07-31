import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useLoading from '@proton/hooks/useLoading';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcCross } from '@proton/icons/icons/IcCross';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectParticipantName } from '@proton/meet/store/slices/participants/participantsSlice';
import type { WaitingRoomJoinRequest } from '@proton/meet/store/slices/waitingRoomSlice';

import { ConditionalTooltip } from '../../../atoms/ConditionalTooltip/ConditionalTooltip';
import { useWaitingRoomContext } from '../../../contexts/WaitingRoomContext';
import { ParticipantNameWithInitials } from '../shared/ParticipantNameWithInitials';

import './WaitingRoomItem.scss';

type Props = {
    request: WaitingRoomJoinRequest;
};

const formatReceivedTime = (receivedAt: number) => {
    return new Date(receivedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

export const WaitingRoomItem = ({ request }: Props) => {
    const { admitRequest, rejectRequest } = useWaitingRoomContext();

    const [isAdmitting, withAdmitLoading] = useLoading();
    const [isRejecting, withRejectLoading] = useLoading();

    const { requestId, participantUid } = request;
    const participantName = useMeetSelector((state) => selectParticipantName(state, participantUid));
    const receivedTime = formatReceivedTime(request.receivedAt);

    return (
        <ParticipantNameWithInitials
            identity={participantUid}
            participantName={participantName}
            statusNode={<div className="text-sm color-hint w-full">{c('Info').t`Joined at ${receivedTime}`}</div>}
        >
            <ConditionalTooltip
                title={!isAdmitting ? c('Action').t`Admit` : undefined}
                tooltipClassName="participants-button-tooltip color-norm"
                placement="top-end"
            >
                <Button
                    className="participant-list-button-background p-2 flex items-center justify-center rounded-full w-custom h-custom border-none"
                    aria-label={c('Action').t`Admit ${participantName}`}
                    size="small"
                    icon={true}
                    onClick={() => {
                        if (isAdmitting || isRejecting) {
                            return;
                        }

                        void withAdmitLoading(admitRequest(requestId));
                    }}
                    loading={isAdmitting}
                    disabled={isRejecting}
                >
                    <IcCheckmark className="color-success" />
                </Button>
            </ConditionalTooltip>

            <ConditionalTooltip
                title={!isRejecting ? c('Action').t`Deny` : undefined}
                tooltipClassName="participants-button-tooltip color-norm"
                placement="top-end"
            >
                <Button
                    className="participant-list-button-background p-2 flex items-center justify-center rounded-full w-custom h-custom border-none"
                    aria-label={c('Action').t`Deny ${participantName}`}
                    size="small"
                    icon={true}
                    onClick={() => {
                        if (isRejecting || isAdmitting) {
                            return;
                        }

                        void withRejectLoading(rejectRequest(requestId, participantUid));
                    }}
                    loading={isRejecting}
                    disabled={isAdmitting}
                >
                    <IcCross className="reject-button" />
                </Button>
            </ConditionalTooltip>
        </ParticipantNameWithInitials>
    );
};
