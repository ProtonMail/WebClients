import { useCallback } from 'react';

import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectParticipantDecryptedNameMap } from '@proton/meet/store/slices/participants/participantsSlice';

import { getMentionPlainText } from '../utils/mentions/mentionPlainText';

export const useMentionPlainText = () => {
    const participantNameMap = useMeetSelector(selectParticipantDecryptedNameMap);

    const everyoneName = c('Label').t`everyone`;
    const unknownName = c('Label').t`unknown`;

    return useCallback(
        (message: string) => getMentionPlainText(message, { participantNameMap, everyoneName, unknownName }),
        [participantNameMap, everyoneName, unknownName]
    );
};
