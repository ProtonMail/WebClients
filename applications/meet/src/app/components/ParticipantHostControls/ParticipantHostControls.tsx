import { useLocalParticipant } from '@livekit/components-react';
import type { Participant } from 'livekit-client';
import { c } from 'ttag';

import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import useLoading from '@proton/hooks/useLoading';
import { IcCrossCircle } from '@proton/icons/icons/IcCrossCircle';
import { IcMeetCameraOff } from '@proton/icons/icons/IcMeetCameraOff';
import { IcMeetMicrophoneOff } from '@proton/icons/icons/IcMeetMicrophoneOff';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';
import clsx from '@proton/utils/clsx';

import { useMLSContext } from '../../contexts/MLSContext';
import { useMeetContext } from '../../contexts/MeetContext';
import { ParticipantCapabilityPermission } from '../../types';

import './ParticipantHostControls.scss';

interface ParticipantHostControlsProps {
    participant: Participant;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    isLocalParticipantAdmin: boolean;
    isLocalParticipantHost: boolean;
}

export const ParticipantHostControls = ({
    participant,
    isAudioEnabled,
    isVideoEnabled,
    isLocalParticipantAdmin,
    isLocalParticipantHost,
}: ParticipantHostControlsProps) => {
    const [loading, withLoading] = useLoading();

    const { localParticipant } = useLocalParticipant();
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const { participantNameMap } = useMeetContext();
    const participantName = participantNameMap[participant.identity] ?? c('Info').t`participant`;

    const mls = useMLSContext();

    const { participantsMap } = useMeetContext();

    const participantData = participantsMap[participant.identity];

    const participantHasAdminPermission =
        participantData !== undefined ? !!participantData.IsAdmin || !!participantData.IsHost : false;

    const hasAccessToParticipantAdminControls =
        (isLocalParticipantHost || (isLocalParticipantAdmin && !participantHasAdminPermission)) &&
        localParticipant?.identity !== participant.identity;

    return (
        <>
            <DropdownButton
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                hasCaret={false}
                shape="ghost"
                className={clsx(
                    'participant-host-controls-dropdown-button rounded-full w-custom h-custom flex items-center justify-center',
                    !hasAccessToParticipantAdminControls && 'visibility-hidden'
                )}
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
                size={{ width: DropdownSizeUnit.Dynamic, maxWidth: '15rem' }}
            >
                <DropdownMenu className="h-full flex flex-column items-start py-2 px-1 flex-nowrap gap-2">
                    <DropdownMenuButton
                        className="participant-host-controls-dropdown-item text-left rounded flex flex-nowrap items-center gap-2 border-none shrink-0 color-norm"
                        liClassName="w-full"
                        onClick={() =>
                            isVideoEnabled &&
                            withLoading(
                                mls.updateParticipantTrackSettings(
                                    participant.identity,
                                    null,
                                    ParticipantCapabilityPermission.NotAllowed
                                )
                            )
                        }
                        loading={loading}
                        disabled={!isVideoEnabled || loading}
                    >
                        <IcMeetCameraOff size={5} className="shrink-0" />
                        <span
                            className="flex-1 text-ellipsis"
                            title={c('Action').t`Disable ${participantName}'s video`}
                        >{c('Action').t`Disable ${participantName}'s video`}</span>
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="participant-host-controls-dropdown-item rounded text-left flex flex-nowrap items-center gap-2 border-none shrink-0 color-norm"
                        liClassName="w-full"
                        onClick={() =>
                            isAudioEnabled &&
                            withLoading(
                                mls.updateParticipantTrackSettings(
                                    participant.identity,
                                    ParticipantCapabilityPermission.NotAllowed,
                                    null
                                )
                            )
                        }
                        loading={loading}
                        disabled={!isAudioEnabled || loading}
                    >
                        <IcMeetMicrophoneOff size={5} className="shrink-0" />
                        <span className="flex-1 text-ellipsis" title={c('Action').t`Mute ${participantName}`}>{c(
                            'Action'
                        ).t`Mute ${participantName}`}</span>
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="participant-host-controls-dropdown-item rounded text-left participant-host-controls-kick-button flex flex-nowrap items-center gap-2 border-none shrink-0"
                        liClassName="w-full"
                        loading={loading}
                        disabled={loading}
                        onClick={() => withLoading(mls.removeParticipant(participant.identity))}
                    >
                        <IcCrossCircle size={5} className="shrink-0" />
                        <span className="flex-1 text-ellipsis" title={c('Action').t`Kick out`}>{c('Action')
                            .t`Kick out ${participantName}`}</span>
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
