import { Component, type ReactNode } from 'react';

import { c } from 'ttag';

interface ArtifactPreviewFallbackProps {
    content: string;
}

export const ArtifactPreviewFallback = ({ content }: ArtifactPreviewFallbackProps) => {
    return (
        <div className="artifact-fallback p-4 flex-1 overflow-auto">
            <p className="text-xs color-warning mb-2">{c('collider_2025:Warning').t`Preview unavailable`}</p>
            <pre className="text-monospace text-sm m-0 overflow-auto color-norm whitespace-pre-wrap">{content}</pre>
        </div>
    );
};

interface ArtifactPreviewErrorBoundaryProps {
    children: ReactNode;
    content: string;
    resetKey: string;
}

interface ArtifactPreviewErrorBoundaryState {
    hasError: boolean;
}

const initialState: ArtifactPreviewErrorBoundaryState = { hasError: false };

/**
 * Catches render-time failures from artifact preview renderers (including lazy-loaded
 * chunks) and shows raw content instead of letting the error bubble to the app boundary.
 */
export class ArtifactPreviewErrorBoundary extends Component<
    ArtifactPreviewErrorBoundaryProps,
    ArtifactPreviewErrorBoundaryState
> {
    constructor(props: ArtifactPreviewErrorBoundaryProps) {
        super(props);
        this.state = initialState;
    }

    static getDerivedStateFromError(): ArtifactPreviewErrorBoundaryState {
        return { hasError: true };
    }

    componentDidUpdate(prevProps: ArtifactPreviewErrorBoundaryProps): void {
        if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
            this.setState(initialState);
        }
    }

    componentDidCatch(error: Error): void {
        console.warn('[ArtifactPreview] Renderer error:', error.message);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return <ArtifactPreviewFallback content={this.props.content} />;
        }
        return this.props.children;
    }
}
