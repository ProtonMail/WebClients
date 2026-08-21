import { c } from 'ttag';

import { isCaptionAgentIdentity } from '@proton/meet/utils/agents';

export const isCaptionAgent = (participant: { isAgent?: boolean; identity?: string }): boolean =>
    Boolean(participant.isAgent) && isCaptionAgentIdentity(participant.identity);

export interface AgentDisplayInfo {
    displayName: string;
    initials: string;
}

export const getAgentDisplayInfo = (identity?: string): AgentDisplayInfo => {
    if (isCaptionAgentIdentity(identity)) {
        return {
            displayName: c('Label').t`Live caption agent`,
            initials: 'CC',
        };
    }

    return {
        displayName: c('Label').t`Agent`,
        initials: '',
    };
};
