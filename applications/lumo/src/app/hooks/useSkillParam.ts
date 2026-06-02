import { useEffect } from 'react';

import { findAgentById } from '../features/agents/registry';
import { useLumoDispatch, useLumoSelector } from '../redux/hooks';
import { setPendingAgent } from '../redux/slices/composerActions';
import { useQueryParam } from './useQueryParam';

/**
 * Activates an agent from a `?skill=<agentId>` link.
 *
 * Only ids that resolve to a built-in (Proton-published) agent or one of the user's own
 * agents are honored, so an arbitrary query value can't inject instructions. Guests only
 * have the built-in catalog available.
 *
 * Shared by both the full conversation surface and the minimal `/agent` surface.
 */
export function useSkillParam() {
    const dispatch = useLumoDispatch();
    const skillParam = useQueryParam('skill');
    const customAgents = useLumoSelector((state) => state.lumoUserSettings.customAgents);

    useEffect(() => {
        if (skillParam && findAgentById(skillParam, customAgents ?? [])) {
            dispatch(setPendingAgent(skillParam));
        }
    }, [skillParam, customAgents, dispatch]);
}
