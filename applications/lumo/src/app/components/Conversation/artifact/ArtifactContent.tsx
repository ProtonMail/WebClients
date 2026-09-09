import { ArtifactPreviewErrorBoundary } from './ArtifactPreviewErrorBoundary';
import { CodeRenderer } from './artifactRenderers';
import { ARTIFACT_TYPE_CONFIG } from './artifactTypeConfig';
import type { ParsedArtifact } from './parseArtifacts';

export type WebpageViewMode = 'preview' | 'code';

interface ArtifactRendererProps {
    artifact: ParsedArtifact;
    showLineNumbers: boolean;
    // Only meaningful for 'webpage' artifacts — lets the user inspect the generated source
    // instead of the live sandboxed render. Ignored for code/document, which have only one view.
    webpageViewMode?: WebpageViewMode;
}

const ArtifactRenderer = ({ artifact, showLineNumbers, webpageViewMode }: ArtifactRendererProps) => {
    if (artifact.type === 'webpage' && webpageViewMode === 'code') {
        return <CodeRenderer artifact={{ ...artifact, language: 'html' }} showLineNumbers={showLineNumbers} />;
    }
    const { Renderer } = ARTIFACT_TYPE_CONFIG[artifact.type];
    return <Renderer artifact={artifact} showLineNumbers={showLineNumbers} />;
};

interface ArtifactContentProps extends ArtifactRendererProps {
    resetKey: string;
}

export const ArtifactContent = ({ artifact, showLineNumbers, webpageViewMode, resetKey }: ArtifactContentProps) => {
    return (
        <ArtifactPreviewErrorBoundary resetKey={resetKey} content={artifact.content}>
            <ArtifactRenderer artifact={artifact} showLineNumbers={showLineNumbers} webpageViewMode={webpageViewMode} />
        </ArtifactPreviewErrorBoundary>
    );
};
