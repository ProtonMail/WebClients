import { VIDEO_CONF_SERVICES } from '../constants';
import { getSlackDataFromString } from './slackHelpers';

const testURL = [
    'https://app.slack.com/huddle/SOMETHING/SOMETHING_ELSE',
    'app.slack.com/huddle/SOMETHING/SOMETHING_ELSE',
    'some test before https://app.slack.com/huddle/SOMETHING/SOMETHING_ELSE',
    'https://app.slack.com/huddle/SOMETHING/SOMETHING_ELSE, some test after',
    'http://app.slack.com/huddle/SOMETHING/SOMETHING_ELSE',
    'some test before app.slack.com/huddle/SOMETHING/SOMETHING_ELSE',
    'app.slack.com/huddle/SOMETHING/SOMETHING_ELSE, some test after',
    'some test before app.slack.com/huddle/SOMETHING/SOMETHING_ELSE, some test after',
];

describe('Slack Helpers', () => {
    it.each(testURL)('should return the correct Slack data for %s', (url) => {
        const data = getSlackDataFromString(url);
        const meetingUrl = 'https://app.slack.com/huddle/SOMETHING/SOMETHING_ELSE';

        expect(data).toStrictEqual({
            service: VIDEO_CONF_SERVICES.SLACK,
            meetingUrl,
        });
    });
});
