import { useRef } from 'react';

import { c } from 'ttag';

import { FeatureCode, Tooltip, useSpotlightOnFeature } from '@proton/components';
import useUser from '@proton/components/hooks/useUser';
import { MONTH } from '@proton/shared/lib/constants';
import { isPlainText, isSent } from '@proton/shared/lib/mail/messages';

import { useMessageTrackers } from '../../../hooks/message/useMessageTrackers';
import { MessageState } from '../../../logic/messages/messagesTypes';
import LoadContentSpotlight from '../../message/LoadContentSpotlight';
import PrivacyDropdown from './PrivacyDropdown';

interface Props {
    message: MessageState;
}

const ItemSpyTrackerIcon = ({ message }: Props) => {
    const [user] = useUser();
    const anchorRef = useRef(null);

    const sent = isSent(message.data);

    const {
        numberOfImageTrackers,
        numberOfUTMTrackers,
        needsMoreProtection,
        imageTrackersLoaded,
        canCleanUTMTrackers,
    } = useMessageTrackers(message);

    // Load content spotlight needs to be displayed if account is older than one month
    const userCreateTime = user.CreateTime || 0;
    const isAccountOlderThanOneMonth = Date.now() > userCreateTime * 1000 + MONTH;

    const { show: showLoadContentSpotlight, onDisplayed: onLoadContentSpotlightDisplayed } = useSpotlightOnFeature(
        FeatureCode.SpotlightLoadContent,
        isAccountOlderThanOneMonth
    );

    const trackerText = needsMoreProtection ? (
        <span>{c('Info').t`Email tracker protection is disabled`}</span>
    ) : (
        <>
            <div className="flex flex-justify-space-between">
                <span>{c('Info').t`Trackers blocked:`}</span>
                <span className="pl-4 text-tabular-nums">{numberOfImageTrackers}</span>
            </div>
            {canCleanUTMTrackers && (
                <div className="flex flex-justify-space-between">
                    <span>{c('Info').t`Links cleaned:`}</span>
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
            <LoadContentSpotlight
                show={showLoadContentSpotlight}
                onDisplayed={onLoadContentSpotlightDisplayed}
                anchorRef={anchorRef}
            >
                <div>
                    {/* Need to wrap the Tooltip by a div to avoid ref warning because Spotlight is cloning the element and applying refs on top of it */}
                    <Tooltip title={trackerText}>
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
