import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { isCaptionAgentIdentity } from '@proton/meet/utils/agents';

import { ParticipantAvatar } from '../../../atoms/ParticipantAvatar/ParticipantAvatar';
import { getAgentDisplayInfo } from '../../../utils/getAgentDisplayInfo';

import './ParticipantNameWithInitials.scss';

const nameLoader = (
    <CircleLoader
        aria-hidden="true"
        className="color-primary w-custom h-custom"
        style={{ '--w-custom': '1rem', '--h-custom': '1rem' }}
    />
);

// An agent row takes its name and status from the identity, so it needs neither of them.
type Props = {
    participantName?: string;
    identity: string;
    isLocal?: boolean;
    statusNode?: React.ReactNode;
    isAgent?: boolean;
    children?: React.ReactNode;
};

export const ParticipantNameWithInitials = ({
    participantName,
    identity,
    isLocal = false,
    statusNode,
    isAgent,
    children,
}: Props) => {
    const isCaptionAgent = Boolean(isAgent && isCaptionAgentIdentity(identity));
    const agentInfo = isAgent ? getAgentDisplayInfo(identity) : undefined;
    const agentStatus = isCaptionAgent ? c('Status').t`Transcribing...` : undefined;
    const agentInformation = isCaptionAgent
        ? c('Subtitle').t`This system agent creates live captions. It is not a participant and cannot send messages.`
        : undefined;

    const participantDisplayName = participantName ?? c('Info').t`Loading...`;
    const displayName = isAgent ? agentInfo?.displayName : participantDisplayName;

    return (
        <>
            <div className="flex flex-nowrap gap-2 h-custom" style={{ '--h-custom': 'fit-content', flexShrink: 0 }}>
                <ParticipantAvatar
                    identity={identity}
                    participantName={participantName}
                    isAgent={isAgent}
                    loadingNode={nameLoader}
                />
                <div className="flex flex-column justify-center">
                    <div className="text-ellipsis w-full" title={displayName}>
                        {displayName} {isLocal ? c('Info').t`(You)` : null}
                    </div>
                    {isAgent ? <div className="text-sm agent-status w-full">{agentStatus}</div> : statusNode}
                </div>
                <div className="flex flex-nowrap items-center ml-auto gap-1 shrink-0">{children}</div>
            </div>
            {agentInformation && <div className="agent-information text-sm pt-3">{agentInformation}</div>}
        </>
    );
};
