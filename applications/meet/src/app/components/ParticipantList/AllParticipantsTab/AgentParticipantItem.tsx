import { ParticipantNameWithInitials } from '../shared/ParticipantNameWithInitials';

export const AgentParticipantItem = ({ identity }: { identity: string }) => {
    return <ParticipantNameWithInitials identity={identity} isAgent />;
};
