import { useMemo } from 'react';

import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectLocalParticipantIdentity,
    selectParticipantDecryptedNameMap,
} from '@proton/meet/store/slices/participants/participantsSlice';
import { selectSortedParticipantIdentities } from '@proton/meet/store/slices/participants/sortedParticipantsSlice';

import { getMentionSuggestions } from '../utils/mentions/mentionSuggestions';

export const useMentionSuggestionList = () => {
    const sortedIdentities = useMeetSelector(selectSortedParticipantIdentities);
    const participantNameMap = useMeetSelector(selectParticipantDecryptedNameMap);
    const localIdentity = useMeetSelector(selectLocalParticipantIdentity);

    const everyoneName = c('Label').t`everyone`;

    return useMemo(
        () => getMentionSuggestions({ sortedIdentities, participantNameMap, localIdentity, everyoneName }),
        [sortedIdentities, participantNameMap, localIdentity, everyoneName]
    );
};
