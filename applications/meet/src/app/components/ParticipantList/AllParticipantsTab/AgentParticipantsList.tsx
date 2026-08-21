import { AgentParticipantItem } from './AgentParticipantItem';
import { useMatchingAgentIdentities } from './useMatchingAgentIdentities';

export const AgentParticipantsList = ({ searchExpression }: { searchExpression: string }) => {
    const agentIdentities = useMatchingAgentIdentities(searchExpression);

    return (
        <>
            {agentIdentities.map((identity) => (
                <li key={identity}>
                    <AgentParticipantItem identity={identity} />
                </li>
            ))}
        </>
    );
};
