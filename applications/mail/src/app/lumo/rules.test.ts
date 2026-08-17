import { MAIL_RULES } from './rules';

describe('MAIL_RULES', () => {
    it.each([
        ['reads are chainable, not one-shot', 'Chain as many as the question needs'],
        ['a tool returning does not end the turn', 'A tool returning is not a reason to reply'],
        ['reads need no permission', 'Reads need no permission'],
        ['only the last read persists on screen', 'Only your LAST one persists'],
        ['starring and unstarring are one tool, not two', 'there is no separate unstar tool'],
        ['marking read and unread are one tool, not two', 'there is no separate mark-unread tool'],
    ])('pins %s', (_case, claim) => {
        expect(MAIL_RULES).toContain(claim);
    });

    it('keeps the no-re-listing rule scoped to replies rather than to any completed read', () => {
        expect(MAIL_RULES).toContain('When you do reply after one of those, do NOT reproduce the results');
    });
});
