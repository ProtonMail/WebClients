import { MAIL_RULES } from './rules';

describe('MAIL_RULES', () => {
    it.each([
        ['reads are chainable, not one-shot', 'Chain as many as the question needs'],
        ['a tool returning does not end the turn', 'A tool returning is not a reason to reply'],
        ['reads need no permission', 'Reads need no permission'],
        ['only the last read persists on screen', 'Only your LAST one persists'],
        ['starring and unstarring are one tool, not two', 'there is no separate unstar tool'],
        ['marking read and unread are one tool, not two', 'there is no separate mark-unread tool'],
        ['a whole location escalates to set_location_read', 'use set_location_read, which takes a location'],
        [
            'a problem report follows a failed knowledge lookup',
            'Only open the problem report form with open_support_ticket',
        ],
    ])('pins %s', (_case, claim) => {
        expect(MAIL_RULES).toContain(claim);
    });
});
