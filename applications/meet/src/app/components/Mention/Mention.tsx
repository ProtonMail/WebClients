import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectLocalParticipantColorIndex,
    selectLocalParticipantIdentity,
    selectParticipantName,
} from '@proton/meet/store/slices/participants/participantsSlice';

import { getMentionLabel } from '../../utils/mentions/mentionLabel';

interface Props {
    id: string;
}

export const Mention = ({ id }: Props) => {
    const participantName = useMeetSelector((state) => selectParticipantName(state, id));
    const localIdentity = useMeetSelector(selectLocalParticipantIdentity);
    const localColorIndex = useMeetSelector(selectLocalParticipantColorIndex);

    const { name, className } = getMentionLabel(id, participantName, {
        localIdentity,
        localColorIndex,
        everyoneName: c('Label').t`everyone`,
        unknownName: c('Label').t`unknown`,
    });

    return <span className={className}>@{name}</span>;
};
