import { filterInviteSuggestions } from './InviteRecommendations';

const make = (email: string, groupName?: string) => ({ email, isGroup: !!groupName, groupName });

describe('filterInviteSuggestions', () => {
    const items = [
        make('john@proton.me'),
        make('alice@proton.me'),
        make('bob@external.com'),
        make('group@org.com', 'Research Team'),
    ];

    test('returns all items when query is empty', () => {
        expect(filterInviteSuggestions('', items)).toEqual(items);
    });

    test('matches email by substring, not just prefix', () => {
        const result = filterInviteSuggestions('proton', items);
        expect(result).toHaveLength(2);
        expect(result.map((r) => r.email)).toEqual(['john@proton.me', 'alice@proton.me']);
    });

    test('matches group by groupName substring', () => {
        const result = filterInviteSuggestions('arch', items);
        expect(result).toHaveLength(1);
        expect(result[0].groupName).toBe('Research Team');
    });

    test('is case-insensitive', () => {
        expect(filterInviteSuggestions('PROTON', items)).toHaveLength(2);
        expect(filterInviteSuggestions('research', items)).toHaveLength(1);
    });
});
