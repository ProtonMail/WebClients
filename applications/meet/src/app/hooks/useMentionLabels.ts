import { useCallback } from 'react';

import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectLocalParticipantColorIndex,
    selectLocalParticipantIdentity,
    selectParticipantDecryptedNameMap,
} from '@proton/meet/store/slices/participants/participantsSlice';

import { getMentionLabel } from '../utils/mentions/mentionLabel';

/** Resolves any mention id in the meeting, for callers that cannot subscribe per participant. */
export const useMentionLabels = () => {
    const participantNameMap = useMeetSelector(selectParticipantDecryptedNameMap);
    const localIdentity = useMeetSelector(selectLocalParticipantIdentity);
    const localColorIndex = useMeetSelector(selectLocalParticipantColorIndex);

    const everyoneName = c('Label').t`everyone`;
    const unknownName = c('Label').t`unknown`;

    return useCallback(
        (id: string) =>
            getMentionLabel(id, participantNameMap[id], {
                localIdentity,
                localColorIndex,
                everyoneName,
                unknownName,
            }),
        [participantNameMap, localIdentity, localColorIndex, everyoneName, unknownName]
    );
};
