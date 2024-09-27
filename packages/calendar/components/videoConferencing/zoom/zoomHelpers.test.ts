import { getZoomDataFromLocation, getZoomFromDescription } from './zoomHelpers';

const joiningInstructions =
    'https://www.google.com/url?q=https://applications.zoom.us/addon/invitation/detail?meetingUuid%3DCyDpeXO%252FQI2zH19%252BuBAyVw%253D%253D%26signature%3D3d8ad8d0493f868c9096a93f0a7e8261cdafc8e4502207c531a5bbef6ec59859%26v%3D1&sa=D&source=calendar&usg=AOvVaw2KiTXgK7GuIM76NpLj3loR';

const testURLs = [
    'this is before https://us05web.zoom.us/j/83674139672?pwd=8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1',
    'this is before us05web.zoom.us/j/83674139672?pwd=8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1',
    'https://us05web.zoom.us/j/83674139672?pwd=8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1 this is after',
    'us05web.zoom.us/j/83674139672?pwd=8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1 this is after',
    'this is before https://us05web.zoom.us/j/83674139672?pwd=8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1 this is after',
    'this is before us05web.zoom.us/j/83674139672?pwd=8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1 this is after',
];

describe('Zoom location helpers', () => {
    it.each(testURLs)('should format the URLs %s', (url) => {
        const data = getZoomDataFromLocation(url);
        const meetingUrl = data?.meetingUrl?.startsWith('https://')
            ? 'https://us05web.zoom.us/j/83674139672?pwd=8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1'
            : 'us05web.zoom.us/j/83674139672?pwd=8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1';

        expect(data).toStrictEqual({
            meetingUrl,
            joiningInstructions: undefined,
            meetingId: '83674139672',
            password: '8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1',
            service: 'zoom',
        });
    });

    it('should not return a random URL containing google meet', () => {
        const location = 'https://meet.google.com/random-url';
        const data = getZoomDataFromLocation(location);
        expect(data).toStrictEqual({
            meetingUrl: undefined,
            joiningInstructions: undefined,
            meetingId: undefined,
            password: undefined,
            service: 'zoom',
        });
    });

    it('should not return a random URL', () => {
        const location = 'https://random-url.com/random-url';
        const data = getZoomDataFromLocation(location);
        expect(data).toStrictEqual({
            meetingUrl: undefined,
            joiningInstructions: undefined,
            meetingId: undefined,
            password: undefined,
            service: 'zoom',
        });
    });
});

describe('Zoom description helpers', () => {
    it('should return the meeting url', () => {
        const description = `
        -::~:~::~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~::~:~::-
        Join Zoom Meeting
        https://us05web.zoom.us/j/83674139672?pwd=8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1 (ID: 83674139672, passcode: 6Z3fiV)

        Joining instructions: ${joiningInstructions}

        ------------
        Zoom for G Suite Add-On Help
        ------------

        Meeting host: easyflavien@gmail.com

        Join Zoom Meeting:
        https://us05web.zoom.us/j/83674139672?pwd=8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1

        Please do not edit this section.
        -::~:~::~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~::~:~::-
        `;

        const meetingUrl = getZoomFromDescription(description);
        expect(meetingUrl).toStrictEqual({
            joiningInstructions,
            meetingId: '83674139672',
            meetingUrl: 'https://us05web.zoom.us/j/83674139672?pwd=8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1',
            password: '6Z3fiV',
            service: 'zoom',
        });
    });
});
