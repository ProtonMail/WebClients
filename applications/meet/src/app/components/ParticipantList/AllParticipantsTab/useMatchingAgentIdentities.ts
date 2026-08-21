import { useMemo } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectAgentIdentities } from '@proton/meet/store/slices/participants/agentParticipantsSlice';

import { getAgentDisplayInfo } from '../../../utils/getAgentDisplayInfo';

/** An empty search expression means no search is running, so every agent matches. */
export const useMatchingAgentIdentities = (searchExpression: string) => {
    const agentIdentities = useMeetSelector(selectAgentIdentities);
    const lowerCaseSearchExpression = searchExpression.toLowerCase();

    return useMemo(() => {
        if (!lowerCaseSearchExpression) {
            return agentIdentities;
        }

        // Agents are absent from the decrypted name map the participants are filtered on, so they
        // match against the name their own row shows instead.
        return agentIdentities.filter((identity) =>
            getAgentDisplayInfo(identity).displayName.toLowerCase().includes(lowerCaseSearchExpression)
        );
    }, [agentIdentities, lowerCaseSearchExpression]);
};

export const useHasMatchingAgents = (searchExpression: string) =>
    useMatchingAgentIdentities(searchExpression).length > 0;
