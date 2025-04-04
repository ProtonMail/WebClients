import { type BaseMeetingUrls, VIDEO_CONF_SERVICES } from '../constants';

const teamsRegex = /\b(?:https?:\/\/)?teams\.live\.com\/meet\/([^?\s,]+)\?p=([^>\s,]+)/;

const meetingIdRegex = /Meeting ID:\s*([\d\s]+)/;
const passwordRegex = /Passcode:\s*([\w]+)/;

export const getTeamsDataFromDescription = (
    description: string
): BaseMeetingUrls & { meetingId?: string; passcode?: string } => {
    const match = description.match(teamsRegex);
    const meetingIdMatch = description.match(meetingIdRegex);
    const passwordMatch = description.match(passwordRegex);
    return {
        service: VIDEO_CONF_SERVICES.TEAMS,
        meetingUrl: match?.[0],
        meetingId: meetingIdMatch?.[1].trim() ?? match?.[1],
        password: passwordMatch?.[1].trim() ?? match?.[2],
    };
};

export const getTeamsDataFromLocation = (text: string): BaseMeetingUrls & { meetingId?: string; password?: string } => {
    const match = text.match(teamsRegex);
    return {
        service: VIDEO_CONF_SERVICES.TEAMS,
        meetingUrl: match?.[0],
        meetingId: match?.[1],
        password: match?.[2],
    };
};
