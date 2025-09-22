import { c } from 'ttag';

import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import { isFirefox } from '@proton/shared/lib/helpers/browser';

export const WebRtcUnsupportedError = () => {
    return (
        <div className="unsupported-browser-container">
            <span>
                {c('Meet')
                    .t`Your browser or device software does not support ${MEET_APP_NAME}. ${MEET_APP_NAME} requires WebRTC to run. Please update your browser or device to a version that supports WebRTC, try a different browser, or check if any extension is disabling WebRTC.`}
            </span>
            <span>
                {isFirefox() &&
                    c('Meet')
                        .t`Additionally, if you are using Firefox, check that PeerConnection is enabled. In the address bar, enter about:config, search for media.peerconnection.enabled, and set it to true.`}
            </span>
        </div>
    );
};
