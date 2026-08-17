import { IcCode } from '@proton/icons/icons/IcCode';
import { IcFileLines } from '@proton/icons/icons/IcFileLines';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcPresentationScreen } from '@proton/icons/icons/IcPresentationScreen';

import { PresentationRenderer } from './PresentationRenderer';
import { WebpageRenderer } from './WebpageRenderer';
import { CodeRenderer, DocumentRenderer } from './artifactRenderers';
import type { ArtifactRendererProps } from './artifactRenderers';
import { getFileExtension } from './parseArtifacts';
import type { ArtifactType, ParsedArtifact } from './parseArtifacts';

export type { ArtifactType } from './parseArtifacts';
export { ARTIFACT_TYPES, isArtifactType } from './parseArtifacts';

interface ArtifactTypeConfigEntry {
    icon: typeof IcCode;
    badgeLabel: string;
    downloadExt: (artifact: ParsedArtifact) => string;
    /**
     * 'selection' — text can be selected in the rendered content and acted on (code).
     * 'freeform' — no text selection UX; a freeform instruction box is shown instead (document).
     * 'none' — no inline-edit affordance at all; follow-ups go through the normal composer
     *          (webpage/presentation — content is rendered inside a sandboxed iframe, so the
     *          panel can't read a text selection out of it the way it can for DOM-rendered
     *          content).
     */
    inlineEditMode: 'selection' | 'freeform' | 'none';
    Renderer: React.ComponentType<ArtifactRendererProps>;
}

export const ARTIFACT_TYPE_CONFIG: Record<ArtifactType, ArtifactTypeConfigEntry> = {
    code: {
        icon: IcCode,
        badgeLabel: 'CODE',
        downloadExt: (artifact) => getFileExtension(artifact.language ?? 'txt'),
        inlineEditMode: 'selection',
        Renderer: CodeRenderer,
    },
    document: {
        icon: IcFileLines,
        badgeLabel: 'DOC',
        downloadExt: () => 'md',
        inlineEditMode: 'freeform',
        Renderer: DocumentRenderer,
    },
    webpage: {
        icon: IcGlobe,
        badgeLabel: 'WEB',
        downloadExt: () => 'html',
        inlineEditMode: 'none',
        Renderer: WebpageRenderer,
    },
    presentation: {
        icon: IcPresentationScreen,
        badgeLabel: 'SLIDES',
        downloadExt: () => 'html',
        inlineEditMode: 'none',
        Renderer: PresentationRenderer,
    },
};
