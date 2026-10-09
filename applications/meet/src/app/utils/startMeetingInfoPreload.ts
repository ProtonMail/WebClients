import { meetingInfoThunk } from '@proton/meet/store/slices/meetingInfoModel';
import type { MeetDispatch } from '@proton/meet/store/store';

import { getUrlMeetingLinkName, getUrlMeetingPassword } from '../hooks/srp/getUrlMeetingParams';
import { trackMeetingInfoPreload } from '../telemetry/loadPerformance';

/**
 * Kicks off the meeting info request for the meeting link in the current URL.
 *
 * Called from the bootstrap so the requests overlap the remaining startup work (crypto and
 * meet-core WASM init) instead of waiting for the prejoin to mount.
 */
export const startMeetingInfoPreload = ({
    dispatch,
    cryptoReady,
}: {
    dispatch: MeetDispatch;
    cryptoReady?: Promise<unknown>;
}) => {
    let meetingLinkName = '';
    let meetingPassword = '';

    try {
        meetingLinkName = getUrlMeetingLinkName();
        meetingPassword = getUrlMeetingPassword();
    } catch {
        // Not a valid meeting link, nothing to preload.
        return;
    }

    if (!meetingLinkName || !meetingPassword) {
        return;
    }

    // Nothing awaits the thunk until the prejoin mounts.
    const preload = dispatch(meetingInfoThunk({ meetingLinkName, meetingPassword, cryptoReady }));
    trackMeetingInfoPreload(preload);
    void preload.catch(() => {});
};
