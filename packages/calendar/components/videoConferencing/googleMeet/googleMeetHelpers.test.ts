import { getGoogleMeetDataFromLocation } from './googleMeetHelpers';

const testURLs = [
    'this is before https://meet.google.com/xxx-yyyy-zzz',
    'this is before https://meet.google.com/xxx-yyyy-zzz',
    'https://meet.google.com/xxx-yyyy-zzz this is after',
    'ttps://meet.google.com/xxx-yyyy-zzz this is after',
    'this is before https://meet.google.com/xxx-yyyy-zzz this is after',
    'this is before https://meet.google.com/xxx-yyyy-zzz this is after',
];

describe('Google meet locations', () => {
    it.each(testURLs)('should format the URLs %s', (url) => {
        const data = getGoogleMeetDataFromLocation(url);
        const meetingUrl = data?.meetingUrl?.startsWith('https://')
            ? 'https://meet.google.com/xxx-yyyy-zzz'
            : 'meet.google.com/xxx-yyyy-zzz';

        expect(data).toStrictEqual({
            meetingUrl,
            joiningInstructions: undefined,
            meetingId: 'xxx-yyyy-zzz',
            service: 'google-meet',
        });
    });

    it('should not return a random URL containing google meet', () => {
        const location = 'https://meet.google.com/random-url';
        const data = getGoogleMeetDataFromLocation(location);
        expect(data).toStrictEqual({
            meetingUrl: undefined,
            joiningInstructions: undefined,
            meetingId: undefined,
            service: 'google-meet',
        });
    });

    it('should not return a random URL', () => {
        const location = 'https://random-url.com/random-url';
        const data = getGoogleMeetDataFromLocation(location);
        expect(data).toStrictEqual({
            meetingUrl: undefined,
            joiningInstructions: undefined,
            meetingId: undefined,
            service: 'google-meet',
        });
    });
});
