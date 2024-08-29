import { useRef } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/components';
import { isPlainText, isSent } from '@proton/shared/lib/mail/messages';

import { useMessageTrackers } from '../../../hooks/message/useMessageTrackers';
import type { MessageState } from '../../../store/messages/messagesTypes';
import LoadContentSpotlight from '../../message/LoadContentSpotlight';
import PrivacyDropdown from './PrivacyDropdown';

interface Props {
    message: MessageState;
}

const ItemSpyTrackerIcon = ({ message }: Props) => {
    const anchorRef = useRef(null);
    const sent = isSent(message.data);

    const {
        numberOfImageTrackers,
        numberOfUTMTrackers,
        needsMoreProtection,
        imageTrackersLoaded,
        canCleanUTMTrackers,
    } = useMessageTrackers(message);

    const trackerText = needsMoreProtection ? (
        <span>{c('Info').t`Email tracker protection is disabled`}</span>
    ) : (
        <>
            <div className="flex flex-nowrap justify-space-between">
                <span className="text-left">{c('Info').t`Trackers blocked:`}</span>
                <span className="pl-4 text-tabular-nums">{numberOfImageTrackers}</span>
            </div>
            {canCleanUTMTrackers && (
                <div className="flex flex-nowrap justify-space-between">
                    <span className="text-left">{c('Info').t`Links cleaned:`}</span>
                    <span className="pl-4 text-tabular-nums">{numberOfUTMTrackers}</span>
                </div>
            )}
        </>
    );

    /*
     * Don't display the tracker icon on sent mail messages
     * OR when trackers are not loaded (but we need to display it when user is not using proxy and in plaintext messages)
     */
    if (sent || (!imageTrackersLoaded && !needsMoreProtection && !isPlainText(message.data))) {
        return null;
    }

    return (
        <span className="absolute message-header-security-icons flex flex-row flex-nowrap">
            <LoadContentSpotlight anchorRef={anchorRef}>
                <div>
                    {/* Need to wrap the Tooltip by a div to avoid ref warning because Spotlight is cloning the element and applying refs on top of it */}
                    <Tooltip title={trackerText} tooltipClassName="tooltip--no-max-width">
                        <div className="flex" ref={anchorRef}>
                            <PrivacyDropdown message={message} />
                        </div>
                    </Tooltip>
                </div>
            </LoadContentSpotlight>
        </span>
    );
};

export default ItemSpyTrackerIcon;
