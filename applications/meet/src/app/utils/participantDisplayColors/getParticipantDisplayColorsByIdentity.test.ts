import { getParticipantDisplayColorsByIdentity } from './getParticipantDisplayColorsByIdentity';

describe('getParticipantDisplayColorsByIdentity', () => {
    it('should return consistent colors for a given identity', () => {
        const colors = getParticipantDisplayColorsByIdentity('user-abc');
        const colorsAgain = getParticipantDisplayColorsByIdentity('user-abc');

        expect(colors).toEqual(colorsAgain);
    });

    it('should return color strings with the correct format', () => {
        const colors = getParticipantDisplayColorsByIdentity('user-abc');

        expect(colors.profileColor).toMatch(/^profile-background-[1-6]$/);
        expect(colors.backgroundColor).toMatch(/^meet-background-[1-6]$/);
        expect(colors.borderColor).toMatch(/^tile-border-[1-6]$/);
        expect(colors.profileTextColor).toMatch(/^profile-color-[1-6]$/);
    });

    it('should return the default colors when identity is undefined', () => {
        const colors = getParticipantDisplayColorsByIdentity(undefined);

        expect(colors).toEqual({
            profileColor: 'profile-background-1',
            backgroundColor: 'meet-background-1',
            borderColor: 'tile-border-1',
            profileTextColor: 'profile-color-1',
        });
    });

    it('should return different colors for different identities', () => {
        const identities = ['alice', 'bob', 'charlie', 'dave', 'eve', 'frank', 'grace', 'heidi'];
        const colorSets = identities.map(getParticipantDisplayColorsByIdentity);

        const unique = new Set(colorSets.map((c) => c.profileColor));
        expect(unique.size).toBeGreaterThan(1);
    });
});
