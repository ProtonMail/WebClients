import { render } from '@testing-library/react';

import { focusLumoPrompt } from './focusLumoPrompt';

describe('focusLumoPrompt', () => {
    it('puts the caret after a restored draft', () => {
        const draft = 'archive the';
        const { container } = render(
            <div id="drawer-app-lumo">
                <textarea data-lumo-prompt value={draft} onChange={jest.fn()} />
            </div>
        );
        const textarea = container.querySelector('textarea')!;

        focusLumoPrompt();

        expect(document.activeElement).toBe(textarea);
        expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([draft.length, draft.length]);
    });

    it('does nothing when no prompt is mounted', () => {
        expect(() => focusLumoPrompt()).not.toThrow();
    });
});
