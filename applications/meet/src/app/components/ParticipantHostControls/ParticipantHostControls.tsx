import type { Participant } from '@proton-meet/livekit-client';
import { c } from 'ttag';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import { IcCrossCircle, IcMeetCameraOff, IcMeetMicrophoneOff, IcThreeDotsVertical } from '@proton/icons';

import { useMLSContext } from '../../contexts/MLSContext';
import { useIsLocalParticipantHost } from '../../hooks/useIsLocalParticipantHost';
import { ParticipantCapabilityPermission } from '../../types';

import './ParticipantHostControls.scss';

interface ParticipantHostControlsProps {
    participant: Participant;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
}

export const ParticipantHostControls = ({
    participant,
    isAudioEnabled,
    isVideoEnabled,
}: ParticipantHostControlsProps) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const isLocalParticipantHost = useIsLocalParticipantHost();

    const mls = useMLSContext();

    if (!isLocalParticipantHost) {
        return null;
    }

    return (
        <>
            <DropdownButton
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                hasCaret={false}
                shape="ghost"
                className="participant-host-controls-dropdown-button rounded-full w-custom h-custom flex items-center justify-center"
                size="small"
                style={{ '--w-custom': '2rem', '--h-custom': '2rem' }}
                icon
            >
                <IcThreeDotsVertical className="shrink-0" alt={c('Alt').t`Participant host control options`} size={5} />
            </DropdownButton>
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                className="participant-host-controls-dropdown p-0 meet-radius border border-norm"
            >
                <DropdownMenu className="w-full h-full flex flex-column items-start py-2 px-4 flex-nowrap gap-2">
                    <DropdownMenuButton
                        className="text-left flex items-center gap-2 color-weak border-none w-full shrink-0"
                        onClick={() =>
                            isVideoEnabled &&
                            mls.updateParticipantTrackSettings(
                                participant.identity,
                                null,
                                ParticipantCapabilityPermission.NotAllowed
                            )
                        }
                    >
                        <IcMeetCameraOff size={5} /> {c('Action').t`Disable video`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="text-left flex items-center gap-2 color-weak border-none w-full shrink-0"
                        onClick={() =>
                            isAudioEnabled &&
                            mls?.updateParticipantTrackSettings(
                                participant.identity,
                                ParticipantCapabilityPermission.NotAllowed,
                                null
                            )
                        }
                    >
                        <IcMeetMicrophoneOff size={5} />
                        {c('Action').t`Mute participant`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="text-left participant-host-controls-kick-button flex items-center gap-2 border-none w-full shrink-0"
                        onClick={() => mls?.removeParticipant(participant.identity)}
                    >
                        <IcCrossCircle size={5} /> {c('Action').t`Kick out`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
