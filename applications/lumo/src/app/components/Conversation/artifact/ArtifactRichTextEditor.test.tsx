import { createRef } from 'react';

import { render, screen, waitFor } from '@testing-library/react';

import ArtifactRichTextEditor from './ArtifactRichTextEditor';
import type { ArtifactRichTextEditorHandle } from './ArtifactRichTextEditor';

describe('ArtifactRichTextEditor', () => {
    it('loads the markdown as rich text and saves it back unchanged', async () => {
        const markdown = '# Ham party\n\nBring **drinks**.\n\n- [ ] RSVP\n\n| a | b |\n| - | - |\n| 1 | 2 |';
        const ref = createRef<ArtifactRichTextEditorHandle>();
        const onUnavailable = jest.fn();

        render(
            <ArtifactRichTextEditor
                ref={ref}
                initialMarkdown={markdown}
                onChange={jest.fn()}
                onUnavailable={onUnavailable}
            />
        );

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Ham party' })).toBeInTheDocument();
        });
        expect(screen.getByRole('toolbar')).toBeInTheDocument();
        expect(ref.current?.getMarkdown()).toBe(markdown);
        expect(onUnavailable).not.toHaveBeenCalled();
    });
});
