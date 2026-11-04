import { isArtifactActionMeta, isMessagePriv } from './types';
import type { ArtifactActionMeta, DeckSelectionField } from './types';

const deckEdit = (field: DeckSelectionField): ArtifactActionMeta => {
    return {
        kind: 'edit',
        artifactId: 'deck-1',
        artifactTitle: 'Deck',
        artifactType: 'presentation',
        selection: 'Slow',
        userInstruction: 'Make it shorter',
        deckSelection: [{ slide: 2, field, bullet: 1, text: 'Slow', selected: 'Slow' }],
    };
};

describe('deck selection action meta', () => {
    // Every field DeckSlide and DeckPreview write as `data-deck-field`.
    const fields: DeckSelectionField[] = [
        'title',
        'subtitle',
        'bullet',
        'left',
        'right',
        'quote',
        'attribution',
        'takeaway',
        'missingData',
        'notes',
    ];

    it.each(fields)('keeps a message that edits the %s field when it is loaded', (field) => {
        expect(isArtifactActionMeta(deckEdit(field))).toBe(true);
        expect(isMessagePriv({ content: 'prompt', artifactAction: deckEdit(field) })).toBe(true);
    });

    it('rejects an unknown field', () => {
        expect(isArtifactActionMeta(deckEdit('body' as DeckSelectionField))).toBe(false);
    });
});
