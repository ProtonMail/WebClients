import { type BaseMeetingUrls, VIDEO_CONF_SERVICES } from '../constants';

const skypeRegex = /\b(?:https?:\/\/)?join\.skype\.com\/([^>\s,]+)/;

export const getSkypeDataFromString = (text: string): BaseMeetingUrls => {
    const match = text.match(skypeRegex);
    return {
        service: VIDEO_CONF_SERVICES.SKYPE,
        meetingUrl: match?.[0],
        meetingId: match?.[1],
    };
};
