import type { ToolCallName } from '../../../lib/toolCall/types';

import './ToolCallLoading.scss';

interface ToolCallLoadingProps {
    toolCallName?: ToolCallName;
}

const ToolCallLoading = ({ toolCallName }: ToolCallLoadingProps) => {
    const text = messageFor(toolCallName);
    return (
        text && (
            <output>
                <span className="gradient-text">{text}</span>
            </output>
        )
    );
};

function messageFor(toolCallName: ToolCallName | undefined): string | undefined {
    if (!toolCallName) {
        return undefined;
    }
    if (toolCallName === 'describe_image') {
        return 'Looking at your picture...';
    }
    if (toolCallName === 'generate_image') {
        return 'Creating your image...';
    }
    if (toolCallName === 'edit_image') {
        return 'Creating your image...';
    }
    if (toolCallName === 'web_search') {
        return 'Searching the web...';
    }
    if (toolCallName === 'proton_info') {
        return 'Checking the latest Proton knowledge...';
    }
}

export default ToolCallLoading;
