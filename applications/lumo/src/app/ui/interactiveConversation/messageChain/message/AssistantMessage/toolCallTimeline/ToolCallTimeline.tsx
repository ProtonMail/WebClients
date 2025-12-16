import { clsx } from 'clsx';

import type { ToolCallData } from '../../../../../../lib/toolCall/types';

import './ToolCallTimeline.scss';

interface ToolCallTimelineItemProps {
    toolCall: ToolCallData;
    isInProgress: boolean;
    isLast: boolean;
}

/**
 * Get human-readable label for tool call.
 * Returns [presentTense, pastTense] tuple.
 */
function getToolCallLabel(toolCall: ToolCallData): [string, string] {
    switch (toolCall.name) {
        case 'web_search':
            return ['Searching the web...', 'Searched the web'];
        case 'describe_image':
            return ['Looking at your image...', 'Looked at your image'];
        case 'generate_image':
            return ['Generating image...', 'Generated image'];
        default:
            return ['Executing tool...', 'Executed tool'];
    }
}

const ToolCallTimelineItemComponent = ({ toolCall, isInProgress }: ToolCallTimelineItemProps) => {
    const [presentLabel, pastLabel] = getToolCallLabel(toolCall);
    const label = isInProgress ? presentLabel : pastLabel;

    return (
        <div className="tool-call-timeline-item">
            {/* Circle indicator */}
            <div className={clsx('tool-call-circle', isInProgress && 'tool-call-circle--in-progress')} />

            {/* Label */}
            <p
                className={clsx(
                    'text-sm m-0 py-0.5',
                    isInProgress ? 'color-norm tool-call-label--in-progress' : 'color-weak'
                )}
            >
                {label}
            </p>
        </div>
    );
};

type ToolCallTimelineItem = { toolCall: ToolCallData; isInProgress: boolean };

interface ToolCallTimelineProps {
    toolCalls: ToolCallTimelineItem[];
}

export const ToolCallTimeline = ({ toolCalls }: ToolCallTimelineProps) => {
    if (toolCalls.length === 0) return null;

    return (
        <div className="tool-call-timeline">
            {toolCalls.map((item, idx) => (
                <ToolCallTimelineItemComponent
                    key={idx}
                    toolCall={item.toolCall}
                    isInProgress={item.isInProgress}
                    isLast={idx === toolCalls.length - 1}
                />
            ))}
        </div>
    );
};
