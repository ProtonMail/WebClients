import type { Attachment } from '../types';

export function isGeneratedArtifactAttachment(
    attachment:
        | Attachment
        | {
              role?: 'user' | 'assistant';
              generatedArtifactAsset?: unknown;
          }
): boolean {
    return attachment.role === 'assistant' && attachment.generatedArtifactAsset !== undefined;
}
