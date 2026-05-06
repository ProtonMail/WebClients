import { ADDRESS_LOCAL_PART_MAX_LENGTH, getAddressSuggestedLocalPart } from './helpers';

jest.mock('@proton/utils/getRandomString', () => ({
    __esModule: true,
    default: jest.fn(() => 'abcd'),
    DEFAULT_LOWERCASE_CHARSET: 'abcdefghijklmnopqrstuvwxyz',
}));

describe('getAddressSuggestedLocalPart', () => {
    describe('Mail B2B path (no suffix, editable email field)', () => {
        it('returns the slugified group name unchanged when it fits', () => {
            expect(getAddressSuggestedLocalPart('Marketing Team')).toBe('marketing-team');
        });

        it('still applies the defensive 40-char cap if the slug somehow exceeds it', () => {
            const longGroupName = 'a'.repeat(60);

            const result = getAddressSuggestedLocalPart(longGroupName);

            expect(result.length).toBeLessThanOrEqual(ADDRESS_LOCAL_PART_MAX_LENGTH);
            expect(result).toBe('a'.repeat(ADDRESS_LOCAL_PART_MAX_LENGTH));
        });
    });

    describe('Non-Mail B2B path (hideMail, generateSuffix=true, hidden email field)', () => {
        it('appends a 4-char suffix and joins org + group when the result fits', () => {
            expect(getAddressSuggestedLocalPart('AlturaTS', 'Acme', true)).toBe('acme-alturats-abcd');
        });

        it('appends a 4-char suffix when no org name is provided', () => {
            expect(getAddressSuggestedLocalPart('Marketing', undefined, true)).toBe('marketing-abcd');
        });

        it('truncates from the front to preserve the suffix (Altura regression)', () => {
            const result = getAddressSuggestedLocalPart('AlturaTS', 'Altura Technical Services Ltd', true);

            expect(result.length).toBeLessThanOrEqual(ADDRESS_LOCAL_PART_MAX_LENGTH);
            expect(result.endsWith('alturats-abcd')).toBe(true);
            expect(result).toBe('ura-technical-services-ltd-alturats-abcd');
        });

        it('strips a leading "-" if the cut lands exactly on a separator', () => {
            // 1-char org + 34-char group + 4-char suffix → slug is 41 chars, slice(-40) lands on the dash after "a"
            const result = getAddressSuggestedLocalPart('cd'.repeat(17), 'a', true);

            expect(result.startsWith('-')).toBe(false);
            expect(result.length).toBeLessThanOrEqual(ADDRESS_LOCAL_PART_MAX_LENGTH);
            expect(result.endsWith('-abcd')).toBe(true);
        });

        it('preserves the full suffix even when group + suffix already saturate the budget', () => {
            const longGroupName = 'a'.repeat(35);

            const result = getAddressSuggestedLocalPart(longGroupName, 'Some Long Organization Name Inc', true);

            expect(result.length).toBeLessThanOrEqual(ADDRESS_LOCAL_PART_MAX_LENGTH);
            expect(result.endsWith('-abcd')).toBe(true);
        });

        it('strips special characters from both org name and group name', () => {
            expect(getAddressSuggestedLocalPart('R&D / Ops!', 'Acme Co.', true)).toBe('acme-co-rd-ops-abcd');
        });

        it('always returns at most 40 characters across a range of inputs', () => {
            const cases: [string, string | undefined][] = [
                ['Group', 'Altura Technical Services Ltd'],
                ['A'.repeat(30), 'B'.repeat(60)],
                ['x', 'y'],
                ['Marketing', undefined],
            ];

            for (const [groupName, orgName] of cases) {
                const result = getAddressSuggestedLocalPart(groupName, orgName, true);
                expect(result.length).toBeLessThanOrEqual(ADDRESS_LOCAL_PART_MAX_LENGTH);
            }
        });
    });
});
