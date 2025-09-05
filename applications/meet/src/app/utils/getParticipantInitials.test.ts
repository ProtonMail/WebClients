import { getParticipantInitials } from './getParticipantInitials';

describe('getParticipantInitials', () => {
    it('should return the initials of the participant name', () => {
        expect(getParticipantInitials('John Doe')).toBe('JD');
    });

    it('should return one initial if the participant name has only one name', () => {
        expect(getParticipantInitials('John')).toBe('J');
    });

    it('should return the first two initials of the participant name with three names', () => {
        expect(getParticipantInitials('Test Participant Name')).toBe('TP');
    });
});
