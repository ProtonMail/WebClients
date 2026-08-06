import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useLoading from '@proton/hooks/useLoading';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcCross } from '@proton/icons/icons/IcCross';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectParticipantName } from '@proton/meet/store/slices/participants/participantsSlice';
import { type WaitingRoomJoinRequest, selectIsMeetingFull } from '@proton/meet/store/slices/waitingRoomSlice';

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

    const isMeetingFull = useMeetSelector(selectIsMeetingFull);

    const { requestId, participantUid } = request;
    const participantName = useMeetSelector((state) => selectParticipantName(state, participantUid));
    const receivedTime = formatReceivedTime(request.receivedAt);

    const getStatus = () => {
        if (isAdmitting) {
            return c('Info').t`Admitting`;
        }

        if (isRejecting) {
            return c('Info').t`Rejecting`;
        }

        return c('Info').t`Waiting since ${receivedTime}`;
    };

    const getAdmittingTooltip = () => {
        if (isMeetingFull) {
            return c('Info').t`Meeting is full`;
        }

        if (!isAdmitting) {
            return c('Info').t`Admit`;
        }

        return undefined;
    };

    return (
        <ParticipantNameWithInitials
            identity={participantUid}
            participantName={participantName}
            statusNode={<div className="text-sm color-hint w-full">{getStatus()}</div>}
        >
            <ConditionalTooltip
                title={getAdmittingTooltip()}
                tooltipClassName="participants-button-tooltip color-norm"
                placement="top-end"
            >
                <Button
                    className="participant-list-button-background p-2 flex items-center justify-center rounded-full w-custom h-custom border-none"
                    aria-label={c('Action').t`Admit ${participantName}`}
                    size="small"
                    icon={true}
                    onClick={() => {
                        if (isAdmitting || isRejecting || isMeetingFull) {
                            return;
                        }

                        void withAdmitLoading(admitRequest(requestId));
                    }}
                    loading={isAdmitting}
                    disabled={isRejecting || isMeetingFull}
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
