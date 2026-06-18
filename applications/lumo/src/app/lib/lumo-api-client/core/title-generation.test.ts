import { Role } from '../../../types-api';
import { extractTitleSourceText } from './title-generation';

describe('title generation helpers', () => {
    it('extracts the latest non-attachment user prompt and truncates to a few lines', () => {
        const turns = [
            { role: Role.System, content: '[Personal context: likes hiking]' },
            { role: Role.User, content: 'File contents:\n----- BEGIN FILE CONTENTS -----\nlong file' },
            {
                role: Role.User,
                content: 'Line one\nLine two\nLine three\nLine four\nLine five',
            },
        ];

        expect(extractTitleSourceText(turns)).toBe('Line one\nLine two\nLine three\nLine four');
    });
});
