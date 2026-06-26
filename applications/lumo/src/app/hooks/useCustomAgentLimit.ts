import { FREE_CUSTOM_AGENT_LIMIT } from '../features/agents/constants';
import { useCustomAgents } from './useCustomAgents';
import { useLumoPlan } from './useLumoPlan';

export function useCustomAgentLimit() {
    const { hasLumoPlus } = useLumoPlan();
    const { personalAgents } = useCustomAgents();

    const personalAgentCount = personalAgents.length;
    const canCreateCustomAgent = hasLumoPlus || personalAgentCount < FREE_CUSTOM_AGENT_LIMIT;
    const hasReachedFreeLimit = !hasLumoPlus && personalAgentCount >= FREE_CUSTOM_AGENT_LIMIT;

    return { canCreateCustomAgent, hasReachedFreeLimit, personalAgentCount };
}
