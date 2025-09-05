import { type BaseMeetingUrls, VIDEO_CONF_SERVICES } from '../constants';

export const PROTON_MEET_REGEX = /https?:\/\/meet(?:\.\w+)?\..+\/join\/id-(\w+)#pwd-([^\s#]+)/;

export const getProtonMeetData = (text: string): BaseMeetingUrls => {
    const match = text.match(PROTON_MEET_REGEX);

    return {
        service: VIDEO_CONF_SERVICES.PROTON_MEET,
        meetingUrl: match?.[0],
        meetingId: match?.[1],
        password: undefined,
        joiningInstructions: undefined,
    };
};
