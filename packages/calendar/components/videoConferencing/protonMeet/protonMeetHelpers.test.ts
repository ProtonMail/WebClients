import { VIDEO_CONF_SERVICES } from '../constants';
import { getProtonMeetData } from './protonMeetHelpers';

const meetingId = '1234567890';

describe('protonMeetHelpers', () => {
    it('should return the correct data for a production url', () => {
        const url = `https://meet.proton.me/join/id-${meetingId}#pwd-1234567890`;

        const data = getProtonMeetData(url);
        expect(data).toEqual({
            service: VIDEO_CONF_SERVICES.PROTON_MEET,
            meetingUrl: url,
            meetingId,
        });
    });

    it('should return the correct data for a proton.black url', () => {
        const url = `https://meet.proton.black/join/id-${meetingId}#pwd-1234567890`;

        const data = getProtonMeetData(url);
        expect(data).toEqual({
            service: VIDEO_CONF_SERVICES.PROTON_MEET,
            meetingUrl: url,
            meetingId,
        });
    });

    it('should return the correct data for a proton.pink url', () => {
        const url = `https://meet.proton.pink/join/id-${meetingId}#pwd-1234567890`;

        const data = getProtonMeetData(url);
        expect(data).toEqual({
            service: VIDEO_CONF_SERVICES.PROTON_MEET,
            meetingUrl: url,
            meetingId,
        });
    });

    it('should return the correct data for a proton.dev url', () => {
        const url = `https://meet.proton.dev/join/id-${meetingId}#pwd-1234567890`;

        const data = getProtonMeetData(url);
        expect(data).toEqual({
            service: VIDEO_CONF_SERVICES.PROTON_MEET,
            meetingUrl: url,
            meetingId,
        });
    });

    it('should return the correct data for a proton.dev url with a port', () => {
        const url = `https://meet.proton.dev:8443/join/id-${meetingId}#pwd-1234567890`;

        const data = getProtonMeetData(url);
        expect(data).toEqual({
            service: VIDEO_CONF_SERVICES.PROTON_MEET,
            meetingUrl: url,
            meetingId,
        });
    });

    it('should return the correct data for a scientist environment', () => {
        const url = `https://meet.scientist.proton.black:8443/join/id-${meetingId}#pwd-1234567890`;

        const data = getProtonMeetData(url);
        expect(data).toEqual({
            service: VIDEO_CONF_SERVICES.PROTON_MEET,
            meetingUrl: url,
            meetingId,
        });
    });
});
