import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectParticipantName } from '@proton/meet/store/slices/participants/participantsSlice';
import { selectSpotlightParticipantIdentity } from '@proton/meet/store/slices/participants/sortedParticipantsSlice';

import { useParticipantsMapContext } from '../../../contexts/ParticipantsProvider/SortedParticipantsProvider';
import { ParticipantTile } from './shared/ParticipantTile/ParticipantTile';
import { SpotlightLayout } from './shared/SpotlightLayout';

export const SpeakerLayout = () => {
    const spotlightParticipantIdentity = useMeetSelector(selectSpotlightParticipantIdentity);

    const participantsMap = useParticipantsMapContext();

    const spotlightParticipant = participantsMap.get(spotlightParticipantIdentity);

    const spotlightParticipantName =
        useMeetSelector((state) => selectParticipantName(state, spotlightParticipantIdentity)) ?? '';

    return (
        <SpotlightLayout ariaLabel={c('Info').t`${spotlightParticipantName} is the active speaker`}>
            {spotlightParticipant && <ParticipantTile participant={spotlightParticipant} viewSize="large" />}
        </SpotlightLayout>
    );
};
