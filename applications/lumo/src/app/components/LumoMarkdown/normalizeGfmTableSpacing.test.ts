import { normalizeGfmTableSpacing } from './normalizeGfmTableSpacing';

describe('normalizeGfmTableSpacing', () => {
    it('adds a blank line before a table that follows text directly', () => {
        expect(
            normalizeGfmTableSpacing(
                [
                    '**Revised "Mykonos Ready" Schedule**',
                    '| Day | Activity | Focus | Notes |',
                    '| :--- | :--- | :--- | :--- |',
                    '| Mon | Barrys | HIIT | High intensity start. |',
                ].join('\n')
            )
        ).toBe(
            [
                '**Revised "Mykonos Ready" Schedule**',
                '',
                '| Day | Activity | Focus | Notes |',
                '| :--- | :--- | :--- | :--- |',
                '| Mon | Barrys | HIIT | High intensity start. |',
            ].join('\n')
        );
    });

    it('keeps existing blank lines before tables unchanged', () => {
        const markdown = [
            '**Revised "Mykonos Ready" Schedule**',
            '',
            '| Day | Activity |',
            '| --- | --- |',
            '| Mon | Barrys |',
        ].join('\n');

        expect(normalizeGfmTableSpacing(markdown)).toBe(markdown);
    });

    it('does not alter table-like content inside fenced code blocks', () => {
        const markdown = [
            'Example:',
            '```markdown',
            '| Day | Activity |',
            '| --- | --- |',
            '| Mon | Barrys |',
            '```',
        ].join('\n');

        expect(normalizeGfmTableSpacing(markdown)).toBe(markdown);
    });
});
