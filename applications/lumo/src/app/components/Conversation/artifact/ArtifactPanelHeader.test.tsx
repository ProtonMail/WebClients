import { render } from '@testing-library/react';

import { PanelHeader } from './ArtifactPanel';

// Pulls in the ESM-only react-markdown via the export pipeline; the header doesn't use it
vi.mock('./useArtifactFileActions', () => {
    return { useArtifactFileActions: vi.fn() };
});

describe('PanelHeader', () => {
    it('does not exempt the title skeleton from the reduced-motion reset', () => {
        const { container } = render(<PanelHeader isStreaming onClose={vi.fn()} layout="docked" />);

        expect(container.querySelector('.artifact-panel-title-skeleton')).toBeInTheDocument();
        expect(container.querySelector('.keep-motion')).not.toBeInTheDocument();
    });
});
