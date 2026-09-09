import { render, screen } from '@testing-library/react';

import { ArtifactPreviewErrorBoundary } from './ArtifactPreviewErrorBoundary';

const ThrowOnRender = () => {
    throw new Error('Renderer failed');
};

describe('ArtifactPreviewErrorBoundary', () => {
    it('shows raw content when a child throws during render', () => {
        render(
            <ArtifactPreviewErrorBoundary resetKey="artifact-1" content="raw artifact body">
                <ThrowOnRender />
            </ArtifactPreviewErrorBoundary>
        );

        expect(screen.getByText('Preview unavailable')).toBeInTheDocument();
        expect(screen.getByText('raw artifact body')).toBeInTheDocument();
    });

    it('retries rendering when resetKey changes', () => {
        let shouldThrow = true;

        const MaybeThrow = () => {
            if (shouldThrow) {
                throw new Error('Renderer failed');
            }
            return <p>Rendered preview</p>;
        };

        const { rerender } = render(
            <ArtifactPreviewErrorBoundary resetKey="artifact-1-v0" content="raw artifact body">
                <MaybeThrow />
            </ArtifactPreviewErrorBoundary>
        );

        expect(screen.getByText('Preview unavailable')).toBeInTheDocument();

        shouldThrow = false;

        rerender(
            <ArtifactPreviewErrorBoundary resetKey="artifact-1-v1" content="raw artifact body">
                <MaybeThrow />
            </ArtifactPreviewErrorBoundary>
        );

        expect(screen.getByText('Rendered preview')).toBeInTheDocument();
    });
});
