import { useMemo } from 'react';

import { useParticipants } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

import { PARTICIPANT_SET_EVENTS } from '../../constants';
import { WANTS_CAPTIONS_ATTR } from './useCaptionsPreference';

const updateOnlyOn = [...PARTICIPANT_SET_EVENTS, RoomEvent.ParticipantAttributesChanged];

export const useCaptionsWantersCount = (): number => {
    const participants = useParticipants({ updateOnlyOn });

    return useMemo(
        () => participants.filter((p) => !p.isAgent && p.attributes?.[WANTS_CAPTIONS_ATTR] === 'true').length,
        [participants]
    );
};
