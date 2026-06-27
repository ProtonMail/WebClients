import { Role } from '../../../types-api';
import { extractTitleSourceText } from './title-generation';

describe('title generation helpers', () => {
    it('extracts the latest non-attachment user prompt and truncates to a few lines', () => {
        const turns = [
            { role: Role.System, content: '[Personal context: likes hiking]' },
            {
                role: Role.User,
                content: 'Filename: data.csv\nFile contents:\n----- BEGIN FILE CONTENTS -----\nrow1\nrow2\nrow3\nrow4\nrow5\nrow6\nrow7\n----- END FILE CONTENTS -----',
            },
            {
                role: Role.User,
                content: 'Line one\nLine two\nLine three\nLine four\nLine five',
            },
        ];

        expect(extractTitleSourceText(turns)).toBe(
            'Filename: data.csv\nFile contents:\n----- BEGIN FILE CONTENTS -----\nrow1\nrow2\nrow3\n[... truncated ...]\nrow5\nrow6\nrow7\n----- END FILE CONTENTS -----\nLine one\nLine two\nLine three\nLine four'
        );
    });

    it('skips image-only turns when finding title source text', () => {
        const turns = [
            { role: Role.User, content: '<lumo-image id="abc" source="user" name="photo.jpg" />' },
            { role: Role.User, content: 'what is in this photo?' },
        ];

        expect(extractTitleSourceText(turns)).toBe('what is in this photo?');
    });
});
