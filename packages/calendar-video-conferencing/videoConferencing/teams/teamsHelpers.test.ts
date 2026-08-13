import { VIDEO_CONF_SERVICES } from '../constants';
import { getTeamsDataFromDescription, getTeamsDataFromLocation } from './teamsHelpers';

const testURL = [
    'https://teams.live.com/meet/MEETING_ID?p=PASSWORD',
    'teams.live.com/meet/MEETING_ID?p=PASSWORD',
    'some test before https://teams.live.com/meet/MEETING_ID?p=PASSWORD',
    'https://teams.live.com/meet/MEETING_ID?p=PASSWORD, some test after',
    'http://teams.live.com/meet/MEETING_ID?p=PASSWORD',
    'some test before teams.live.com/meet/MEETING_ID?p=PASSWORD',
    'teams.live.com/meet/MEETING_ID?p=PASSWORD, some test after',
    'some test before teams.live.com/meet/MEETING_ID?p=PASSWORD, some test after',
];

describe('Teams Helpers', () => {
    it.each(testURL)('should return the correct Teams data for %s', (url) => {
        const data = getTeamsDataFromLocation(url);
        const meetingUrl = 'https://teams.live.com/meet/MEETING_ID?p=PASSWORD';

        expect(data).toStrictEqual({
            service: VIDEO_CONF_SERVICES.TEAMS,
            meetingUrl,
            meetingId: 'MEETING_ID',
            password: 'PASSWORD',
        });
    });

    it('should parse the description and grab the Teams meeting data', () => {
        const data = getTeamsDataFromDescription(`Microsoft Teams meeting
        Join on your computer, mobile app or room device
        Click here to join the meeting<https://teams.live.com/meet/9346628868165?p=IuBKlitIxSGksLCMG8>
        Meeting ID: 934 662 886 816 5
        Passcode: 2mp6r7
        Download Teams<https://www.microsoft.com/en-us/microsoft-teams/download-app> | Join on the web<https://www.microsoft.com/microsoft-teams/join-a-meeting>
        Learn More<https://aka.ms/JoinTeamsMeeting> | Meeting options<https://teams.live.com/meetingOptions/meetings/9346628868165/view?localeCode=en-US>`);

        expect(data).toStrictEqual({
            service: VIDEO_CONF_SERVICES.TEAMS,
            meetingUrl: 'https://teams.live.com/meet/9346628868165?p=IuBKlitIxSGksLCMG8',
            meetingId: '934 662 886 816 5',
            password: '2mp6r7',
        });
    });

    it('should fallback to the link data if cannot parse the description', () => {
        const data = getTeamsDataFromDescription(`Microsoft Teams meeting
        Join on your computer, mobile app or room device
        Click here to join the meeting<https://teams.live.com/meet/9346628868165?p=IuBKlitIxSGksLCMG8>
        ERRRORMeetingID:934 662 886 816 5
        ERRRORPasscode/:2mp6r7
        Download Teams<https://www.microsoft.com/en-us/microsoft-teams/download-app> | Join on the web<https://www.microsoft.com/microsoft-teams/join-a-meeting>
        Learn More<https://aka.ms/JoinTeamsMeeting> | Meeting options<https://teams.live.com/meetingOptions/meetings/9346628868165/view?localeCode=en-US>`);

        expect(data).toStrictEqual({
            service: VIDEO_CONF_SERVICES.TEAMS,
            meetingUrl: 'https://teams.live.com/meet/9346628868165?p=IuBKlitIxSGksLCMG8',
            meetingId: '9346628868165',
            password: 'IuBKlitIxSGksLCMG8',
        });
    });
});
