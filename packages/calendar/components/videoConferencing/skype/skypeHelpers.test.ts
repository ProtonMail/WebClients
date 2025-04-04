import { VIDEO_CONF_SERVICES } from '../constants';
import { getSkypeDataFromString } from './skypeHelpers';

const testURL = [
    'https://join.skype.com/abc123',
    'join.skype.com/abc123',
    'some test before https://join.skype.com/abc123',
    'https://join.skype.com/abc123, some test after',
];

describe('Skype Helpers', () => {
    it.each(testURL)('should return the correct Skype data for %s', (url) => {
        const data = getSkypeDataFromString(url);
        const meetingUrl = data.meetingUrl?.startsWith('https://')
            ? 'https://join.skype.com/abc123'
            : 'join.skype.com/abc123';

        expect(data).toStrictEqual({
            service: VIDEO_CONF_SERVICES.SKYPE,
            meetingUrl,
            meetingId: 'abc123',
        });
    });
});
