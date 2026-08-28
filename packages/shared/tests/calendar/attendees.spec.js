import { generateAttendeeToken, getAttendeeEmail } from '../../lib/calendar/attendees';
import { parse } from '../../lib/calendar/vcal';

const expectedToken = 'c2d3d0b4eb4ef80633f9cc7755991e79ca033016';

describe('generateAttendeeToken()', () => {
    it('should produce correct tokens', async () => {
        const token = await generateAttendeeToken('james@mi6.org', 'uid@proton.me');
        expect(token).toBe(expectedToken);
    });
});

describe('getAttendeeEmail()', () => {
    it('should prioritize the attendee value', async () => {
        const ics = `BEGIN:VEVENT
ATTENDEE;CN=email2@test.com;EMAIL=email3@test.com;PARTSTAT=NEEDS-ACTION;ROLE=REQ-PARTICIPANT:mailto:email@test.com
END:VEVENT`;
        const { attendee } = parse(ics);
        const email = await getAttendeeEmail(attendee[0]);
        expect(email).toBe('email@test.com');
    });

    it('should prioritize the email value if attendee value is not an email', async () => {
        const ics = `BEGIN:VEVENT
ATTENDEE;CN=email2@test.com;EMAIL=email3@test.com;PARTSTAT=NEEDS-ACTION;ROLE=REQ-PARTICIPANT:IAmNotAnEmail
END:VEVENT`;
        const { attendee } = parse(ics);
        const email = await getAttendeeEmail(attendee[0]);
        expect(email).toBe('email3@test.com');
    });

    it('should return cn value if attendee and email values are not emails', async () => {
        const ics = `BEGIN:VEVENT
ATTENDEE;CN=email2@test.com;EMAIL=IAmNotAnEmailEither;PARTSTAT=NEEDS-ACTION;ROLE=REQ-PARTICIPANT:IAmNotAnEmail
END:VEVENT`;
        const { attendee } = parse(ics);
        const email = await getAttendeeEmail(attendee[0]);
        expect(email).toBe('email2@test.com');
    });

    it('should fall back to the attendee value if attendee, cn and email values are not emails', async () => {
        const ics = `BEGIN:VEVENT
ATTENDEE;CN=IAmNotAnEmailEither;EMAIL=NoEmailToBeFound;PARTSTAT=NEEDS-ACTION;ROLE=REQ-PARTICIPANT:IAmNotAnEmail
END:VEVENT`;
        const { attendee } = parse(ics);
        const email = await getAttendeeEmail(attendee[0]);
        expect(email).toBe('IAmNotAnEmail');
    });
});
