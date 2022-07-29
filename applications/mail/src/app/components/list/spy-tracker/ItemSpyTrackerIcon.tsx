import React, { useRef } from 'react';

import { c } from 'ttag';

import {
    FeatureCode,
    Href,
    Spotlight,
    Tooltip,
    classnames,
    useModalState,
    useSpotlightOnFeature,
    useSpotlightShow,
} from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { isSent } from '@proton/shared/lib/mail/messages';

import { useMessageTrackers } from '../../../hooks/message/useMessageTrackers';
import { MessageState } from '../../../logic/messages/messagesTypes';
import SpyTrackerIcon from './SpyTrackerIcon';
import SpyTrackerModal from './SpyTrackerModal';

interface Props {
    message: MessageState;
    className?: string;
}

const ItemSpyTrackerIcon = ({ message, className }: Props) => {
    const [spyTrackerModalProps, setSpyTrackerModalOpen] = useModalState();

    const anchorRef = useRef(null);

    const sent = isSent(message.data);

    const { hasProtection, hasShowImage, numberOfTrackers, needsMoreProtection, title } = useMessageTrackers({
        message,
    });

    // Display the spotlight only once, if trackers have been found inside the email
    const { show: showSpotlight, onDisplayed } = useSpotlightOnFeature(
        FeatureCode.SpotlightSpyTrackerProtection,
        numberOfTrackers > 0
    );

    const shouldShowSpotlight = useSpotlightShow(showSpotlight);

    /*
     * Don't display the tracker icon on sent mails or when :
     * Loading remote images is automatic and email protection is OFF : We consider that the user don't want any protection at all.
     * But the user might have set recently the protection to OFF, so if we find trackers in previous emails, we still display the icon.
     */
    if (sent || (!hasProtection && hasShowImage && numberOfTrackers === 0)) {
        return null;
    }

    return (
        <Spotlight
            originalPlacement="top-right"
            show={shouldShowSpotlight}
            onDisplayed={onDisplayed}
            anchorRef={anchorRef}
            content={
                <>
                    {c('Spotlight').t`To protect your privacy, Proton blocked email trackers in this message`}
                    <br />
                    <Href url={getKnowledgeBaseUrl('/email-tracker-protection')} title="Tracker protection">
                        {c('Info').t`Learn more`}
                    </Href>
                </>
            }
        >
            <div>
                {/* Need to wrap the Tooltip by a div to avoid ref warning because Spotlight is cloning the element and applying refs on top of it */}
                <Tooltip title={title} data-testid="privacy:icon-tooltip">
                    <div className={classnames(['flex', className])} ref={anchorRef}>
                        <SpyTrackerIcon
                            numberOfTrackers={numberOfTrackers}
                            needsMoreProtection={needsMoreProtection}
                            title={title}
                            openSpyTrackerModal={() => setSpyTrackerModalOpen(true)}
                        />
                    </div>
                </Tooltip>
                <SpyTrackerModal message={message} {...spyTrackerModalProps} />
            </div>
        </Spotlight>
    );
};

export default ItemSpyTrackerIcon;
