import type { Participant } from 'livekit-client';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcCross } from '@proton/icons/icons/IcCross';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectParticipantName } from '@proton/meet/store/slices/participants/participantsSlice';

import { ParticipantNameWithInitials } from '../shared/ParticipantNameWithInitials';

import './WaitingRoomItem.scss';

type Props = {
    participant: Participant;
};

export const WaitingRoomItem = ({ participant }: Props) => {
    const participantName = useMeetSelector((state) => selectParticipantName(state, participant.identity));

    return (
        <ParticipantNameWithInitials
            participant={participant}
            participantName={participantName}
            statusNode={<div className="text-sm color-hint w-full">some@email.com</div>}
        >
            <Tooltip
                title={c('Action').t`Admit`}
                tooltipClassName="participants-button-tooltip color-norm"
                originalPlacement="top-end"
            >
                <Button
                    className="participant-list-button-background p-2 flex items-center justify-center rounded-full w-custom h-custom border-none"
                    style={{ '--w-custom': '2rem', '--h-custom': '2rem' }}
                    aria-label={c('Action').t`Admit ${participantName}`}
                    onClick={() => {
                        // TODO: wire up waiting room admit action
                    }}
                >
                    <IcCheckmark className="color-success" />
                </Button>
            </Tooltip>

            <Tooltip
                title={c('Action').t`Deny`}
                tooltipClassName="participants-button-tooltip color-norm"
                originalPlacement="top-end"
            >
                <Button
                    className="participant-list-button-background p-2 flex items-center justify-center rounded-full w-custom h-custom border-none"
                    style={{ '--w-custom': '2rem', '--h-custom': '2rem' }}
                    aria-label={c('Action').t`Deny ${participantName}`}
                    onClick={() => {
                        // TODO: wire up waiting room deny action
                    }}
                >
                    <IcCross className="reject-button" />
                </Button>
            </Tooltip>
        </ParticipantNameWithInitials>
    );
};
