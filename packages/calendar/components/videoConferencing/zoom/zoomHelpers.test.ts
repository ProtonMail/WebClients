import { getZoomDataFromLocation, getZoomFromDescription } from './zoomHelpers';

const joiningInstructions =
    'https://www.google.com/url?q=https://applications.zoom.us/addon/invitation/detail?meetingUuid%3DCyDpeXO%252FQI2zH19%252BuBAyVw%253D%253D%26signature%3D3d8ad8d0493f868c9096a93f0a7e8261cdafc8e4502207c531a5bbef6ec59859%26v%3D1&sa=D&source=calendar&usg=AOvVaw2KiTXgK7GuIM76NpLj3loR';

const testURLs = [
    'https://us05web.zoom.us/j/83674139672?pwd=8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1',
    'http://us05web.zoom.us/j/83674139672?pwd=8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1',
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
        const meetingUrl = 'https://us05web.zoom.us/j/83674139672?pwd=8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1';

        expect(data).toStrictEqual({
            meetingUrl,
            joiningInstructions: undefined,
            meetingId: '83674139672',
            password: '8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1',
            service: 'zoom',
        });
    });

    it('should format the personal meetings', () => {
        const location = 'https://us02web.zoom.us/my/protonCustom';
        const dataLocation = getZoomDataFromLocation(location);
        const dataDescription = getZoomDataFromLocation(location);

        const expectData = {
            service: 'zoom',
            meetingUrl: 'https://us02web.zoom.us/my/protonCustom',
            meetingId: 'protonCustom',
            joiningInstructions: undefined,
            password: undefined,
        };

        expect(dataLocation).toStrictEqual(expectData);
        expect(dataDescription).toStrictEqual(expectData);
    });

    it('should format the personal meetings', () => {
        const location = 'https://us02web.zoom.us/j/protonCustom';
        const dataLocation = getZoomDataFromLocation(location);
        const dataDescription = getZoomDataFromLocation(location);

        const expectData = {
            service: 'zoom',
            meetingUrl: 'https://us02web.zoom.us/j/protonCustom',
            meetingId: 'protonCustom',
            joiningInstructions: undefined,
            password: undefined,
        };

        expect(dataLocation).toStrictEqual(expectData);
        expect(dataDescription).toStrictEqual(expectData);
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

    it('should find passcode in the description', () => {
        const description = `
            Join Zoom Meeting https://us05web.zoom.us/j/83674139672?pwd=8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1  
            Meeting ID: 83674139672
            Passcode: 6Z3fiV
        `;

        const descriptionTwo = `
            Join Zoom Meeting https://us05web.zoom.us/j/83674139672?pwd=8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1  
            Meeting ID: 83674139672
            passcode: 6Z3fiV
        `;

        const descriptionThree = `
            Join Zoom Meeting https://us05web.zoom.us/j/83674139672?pwd=8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1  
            Meeting ID: 83674139672
            PAssCODe: 6Z3fiV
        `;

        const meetingData = getZoomFromDescription(description);
        const meetingDataTwo = getZoomFromDescription(descriptionTwo);
        const meetingDataThree = getZoomFromDescription(descriptionThree);
        expect(meetingData).toStrictEqual({
            joiningInstructions: undefined,
            meetingId: '83674139672',
            meetingUrl: 'https://us05web.zoom.us/j/83674139672?pwd=8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1',
            password: '6Z3fiV',
            service: 'zoom',
        });

        expect(meetingDataTwo).toStrictEqual({
            joiningInstructions: undefined,
            meetingId: '83674139672',
            meetingUrl: 'https://us05web.zoom.us/j/83674139672?pwd=8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1',
            password: '6Z3fiV',
            service: 'zoom',
        });

        expect(meetingDataThree).toStrictEqual({
            joiningInstructions: undefined,
            meetingId: '83674139672',
            meetingUrl: 'https://us05web.zoom.us/j/83674139672?pwd=8Rbz0DfJeacG99xbU9R6sR9DEMCYsM.1',
            password: '6Z3fiV',
            service: 'zoom',
        });
    });
});
