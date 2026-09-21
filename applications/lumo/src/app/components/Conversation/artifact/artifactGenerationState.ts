import type { ContentBlock, Message } from '../../../types';
import type { ArtifactRegistry } from './artifactRegistry';
import { CREATE_ARTIFACT_TOOL_NAME } from './createArtifactTool';
import type { ParsedArtifact } from './parseArtifacts';

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
        // Malformed or partial JSON — fall through.
    }

    return undefined;
}

function hasCreateArtifactToolCallBlock(blocks: ContentBlock[]): boolean {
    return blocks.some((block) => {
        return getToolCallNameFromBlock(block) === CREATE_ARTIFACT_TOOL_NAME;
    });
}

function parentUserRequestedArtifact(parentUserMessage?: Message): boolean {
    if (!parentUserMessage) {
        return false;
    }

    return parentUserMessage.artifactCreateModeActive === true || parentUserMessage.artifactAction !== undefined;
}

/**
 * True while the assistant is generating an artifact that is not yet parseable from blocks.
 * Covers the gap before the create_artifact tool call lands (explicit create / inline-edit turns)
 * and while a tool call block exists but arguments are still incomplete.
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

    return parentUserRequestedArtifact(input.parentUserMessage) || hasCreateArtifactToolCallBlock(input.blocks);
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

/**
 * True while a follow-up revision is being generated for an artifact the user was already
 * viewing in the panel (latest version). Keeps the current version visible with a lightweight
 * loading overlay until the in-flight message produces a parseable new version.
 */
export function isArtifactRevisionLoading(input: {
    isGenerating: boolean;
    isLastMessage: boolean;
    completeArtifacts: ParsedArtifact[];
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

    if (input.completeArtifacts.some((artifact) => artifact.id === input.selectedId)) {
        return false;
    }

    return parentUserTargetedArtifactRevision(input.parentUserMessage, input.selectedId);
}
