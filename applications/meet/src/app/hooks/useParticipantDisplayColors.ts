import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectLocalParticipantColorIndex,
    selectLocalParticipantIdentity,
} from '@proton/meet/store/slices/sortedParticipantsSlice';

import { getParticipantDisplayColorsByIdentity } from '../utils/participantDisplayColors/getParticipantDisplayColorsByIdentity';
import { getParticipantDisplayColorsByIndex } from '../utils/participantDisplayColors/getParticipantDisplayColorsByIndex';

export const useParticipantDisplayColors = (identity: string | undefined) => {
    const localParticipantIdentity = useMeetSelector(selectLocalParticipantIdentity);
    const localParticipantColorIndex = useMeetSelector(selectLocalParticipantColorIndex);

    if (!identity) {
        return { participantColors: getParticipantDisplayColorsByIndex(0) };
    }

    const participantColors =
        identity === localParticipantIdentity
            ? getParticipantDisplayColorsByIndex(localParticipantColorIndex)
            : getParticipantDisplayColorsByIdentity(identity);

    return { participantColors };
};
