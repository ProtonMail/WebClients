import { getParticipantDisplayColors } from './getParticipantDisplayColors';

describe('getParticipantDisplayColors', () => {
    it('should return the proper colors for a participant', () => {
        const participant = {
            metadata: JSON.stringify({
                profileColor: 'test',
                backgroundColor: 'test',
                borderColor: 'test',
                profileTextColor: 'test',
            }),
        };

        const colors = getParticipantDisplayColors(participant);

        expect(colors).toEqual({
            profileColor: 'test',
            backgroundColor: 'test',
            borderColor: 'test',
            profileTextColor: 'test',
        });
    });

    it('should return the default colors if the participant has no proper metadata', () => {
        const participant = {
            metadata: JSON.stringify({}),
        };

        const colors = getParticipantDisplayColors(participant);

        expect(colors).toEqual({
            profileColor: 'profile-background-1',
            backgroundColor: 'meet-background-1',
            borderColor: 'tile-border-1',
            profileTextColor: 'profile-color-1',
        });
    });
});
