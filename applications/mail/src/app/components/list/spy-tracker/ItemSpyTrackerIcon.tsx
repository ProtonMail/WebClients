import { useRef } from 'react';
import { c } from 'ttag';
import { FeatureCode, Spotlight, useSpotlightOnFeature, classnames, Href, Tooltip } from '@proton/components';
import * as React from 'react';
import { MessageExtended } from '../../../models/message';

import { useMessageTrackers } from '../../../hooks/message/useMessageTrackers';
import SpyTrackerIcon from './SpyTrackerIcon';

interface Props {
    message: MessageExtended;
    className?: string;
}

const ItemSpyTrackerIcon = ({ message, className }: Props) => {
    const anchorRef = useRef(null);

    const { hasProtection, hasShowImage, numberOfTrackers, needsMoreProtection, title, openSpyTrackerModal } =
        useMessageTrackers({
            message,
        });

    // Display the spotlight only once, if trackers have been found inside the email
    const { show: showSpotlight, onDisplayed } = useSpotlightOnFeature(
        FeatureCode.SpotlightSpyTrackerProtection,
        numberOfTrackers > 0
    );

    /*
     * Don't display the tracker icon when :
     * Loading remote images is automatic and email protection is OFF : We consider that the user don't want any protection at all.
     * But the user might have set recently the protection to OFF, so if we find trackers in previous emails, we still display the icon.
     */
    if (!hasProtection && hasShowImage && numberOfTrackers === 0) {
        return null;
    }

    return (
        <Spotlight
            originalPlacement="top-right"
            show={showSpotlight}
            onDisplayed={onDisplayed}
            anchorRef={anchorRef}
            content={
                <>
                    {c('Spotlight').t`To protect your privacy, Proton blocked email trackers in this message`}
                    <br />
                    <Href url="https://protonmail.com/support/email-tracker-protection" title="Tracker protection">
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
                            openSpyTrackerModal={openSpyTrackerModal}
                        />
                    </div>
                </Tooltip>
            </div>
        </Spotlight>
    );
};

export default ItemSpyTrackerIcon;
