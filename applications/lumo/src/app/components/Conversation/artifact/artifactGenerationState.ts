import type { ContentBlock, Message } from '../../../types';
import type { ArtifactRegistry } from './artifactRegistry';
import { CREATE_ARTIFACT_TOOL_NAME } from './createArtifactTool';
import type { ParsedArtifact } from './parseArtifacts';

function readToolCallNameFromPartialContent(content: string): string | undefined {
    const match = content.match(/"name"\s*:\s*"([^"\\]+)"/);
    if (typeof match?.[1] === 'string') {
        return match[1];
    }

    return undefined;
}

export function getToolCallNameFromBlock(block: ContentBlock): string | undefined {
    if (block.type !== 'tool_call') {
        return undefined;
    }

    const parsed = block.toolCall as { name?: string } | undefined;
    if (typeof parsed?.name === 'string') {
        return parsed.name;
    }

    try {
        const raw = JSON.parse(block.content) as { name?: string };
        if (typeof raw.name === 'string') {
            return raw.name;
        }
    } catch {
        // Malformed or partial JSON — try to read the name field from the stream.
        return readToolCallNameFromPartialContent(block.content);
    }

    return undefined;
}

function hasCreateArtifactToolCallBlock(blocks: ContentBlock[]): boolean {
    return blocks.some((block) => {
        return getToolCallNameFromBlock(block) === CREATE_ARTIFACT_TOOL_NAME;
    });
}

function parentUserSentArtifactAction(parentUserMessage?: Message): boolean {
    if (!parentUserMessage) {
        return false;
    }

    // Panel inline-edit only — not artifactCreateModeActive / preference-on sends, which would
    // flash loading for ordinary chat turns before the model decides to call create_artifact.
    return parentUserMessage.artifactAction !== undefined;
}

function isCreateArtifactToolInProgress(blocks: ContentBlock[], parentUserMessage?: Message): boolean {
    return hasCreateArtifactToolCallBlock(blocks) || parentUserSentArtifactAction(parentUserMessage);
}

/**
 * True while the in-chat artifact chip should show a loading state — only before the tool call
 * has produced parseable artifact content.
 */
export function isArtifactGenerationLoading(input: {
    isGenerating: boolean;
    isLastMessage: boolean;
    completeArtifacts: ParsedArtifact[];
    blocks: ContentBlock[];
    parentUserMessage?: Message;
}): boolean {
    if (!input.isGenerating || !input.isLastMessage) {
        return false;
    }

    if (input.completeArtifacts.length > 0) {
        return false;
    }

    return isCreateArtifactToolInProgress(input.blocks, input.parentUserMessage);
}

/**
 * True while the side panel should show its loading shell — from the first create_artifact
 * tool_call chunk through until an artifact is opened in the panel (even if arguments already
 * parsed before the panel selection catches up).
 */
export function isArtifactPanelGenerationLoading(input: {
    isGenerating: boolean;
    isLastMessage: boolean;
    blocks: ContentBlock[];
    parentUserMessage?: Message;
}): boolean {
    if (!input.isGenerating || !input.isLastMessage) {
        return false;
    }

    return isCreateArtifactToolInProgress(input.blocks, input.parentUserMessage);
}

function parentUserTargetedArtifactRevision(parentUserMessage: Message | undefined, artifactId: string): boolean {
    if (!parentUserMessage) {
        return false;
    }

    if (parentUserMessage.artifactRevisionTargetId === artifactId) {
        return true;
    }

    return parentUserMessage.artifactAction?.artifactId === artifactId;
}

function isRevisingOpenArtifact(input: {
    blocks: ContentBlock[];
    completeArtifacts: ParsedArtifact[];
    parentUserMessage?: Message;
    selectedId: string;
}): boolean {
    if (parentUserTargetedArtifactRevision(input.parentUserMessage, input.selectedId)) {
        return true;
    }

    if (!hasCreateArtifactToolCallBlock(input.blocks)) {
        return false;
    }

    // Chat follow-up revisions (revise tool mode) do not set artifactRevisionTargetId on the
    // user message — once create_artifact starts, treat it as a revision while the panel is open.
    const streamingArtifactIds = input.completeArtifacts.map((artifact) => {
        return artifact.id;
    });
    if (streamingArtifactIds.length > 0) {
        return streamingArtifactIds.includes(input.selectedId);
    }

    return true;
}

/**
 * True while a follow-up revision is being generated for an artifact the user was already
 * viewing in the panel (latest version). Keeps the current version visible with a lightweight
 * loading overlay for the full assistant turn — even after parseable content arrives early.
 */
export function isArtifactRevisionLoading(input: {
    isGenerating: boolean;
    isLastMessage: boolean;
    completeArtifacts: ParsedArtifact[];
    blocks: ContentBlock[];
    parentUserMessage?: Message;
    selectedId: string | null;
    selectedVersionIndex: number;
    registry: ArtifactRegistry;
}): boolean {
    if (!input.isGenerating || !input.isLastMessage || !input.selectedId) {
        return false;
    }

    const entry = input.registry[input.selectedId];
    if (!entry) {
        return false;
    }

    const isViewingLatest = input.selectedVersionIndex === entry.versions.length - 1;
    if (!isViewingLatest) {
        return false;
    }

    return isRevisingOpenArtifact({
        blocks: input.blocks,
        completeArtifacts: input.completeArtifacts,
        parentUserMessage: input.parentUserMessage,
        selectedId: input.selectedId,
    });
}
