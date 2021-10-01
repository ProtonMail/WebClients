import { useRef } from 'react';
import { c } from 'ttag';
import { classnames, Href, SettingsLink, Tooltip } from '@proton/components';
import {
    FeatureCode,
    Spotlight,
    useSpotlightOnFeature,
} from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import * as React from 'react';
import { emailTrackerProtectionURL } from '../../constants';
import { MessageExtended } from '../../models/message';

import './ItemSpyTrackerIcon.scss';
import { useMessageTrackers } from '../../hooks/message/useMessageTrackers';
import SpyTrackerIcon from '../message/SpyTrackerIcon';

interface Props {
    message: MessageExtended;
    className?: string;
}

const ItemSpyTrackerIcon = ({ message, className }: Props) => {
    const anchorRef = useRef(null);

    const { hasProtection, hasShowImage, numberOfTrackers, needsMoreProtection, getTitle } = useMessageTrackers({
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

    const icon = (
        <SpyTrackerIcon
            numberOfTrackers={numberOfTrackers}
            needsMoreProtection={needsMoreProtection}
            title={getTitle()}
        />
    );

    return (
        <Spotlight
            originalPlacement="top-right"
            show={showSpotlight}
            onDisplayed={onDisplayed}
            anchorRef={anchorRef}
            content={
                <>
                    <div className="text-bold text-lg mauto">{c('Spotlight').t`Tracker protection`}</div>
                    {c('Spotlight').t`Proton blocked email trackers in this message in order to protect your privacy`}
                    <br />
                    <Href url="https://protonmail.com/support/email-tracker-protection" title="Tracker protection">
                        {c('Info').t`Learn more`}
                    </Href>
                </>
            }
        >
            <div>
                {/* Need to wrap the Tooltip by a div to avoid ref warning because Spotlight is cloning the element and applying refs on top of it */}
                <Tooltip title={getTitle()} data-testid="privacy:icon-tooltip">
                    <div className={classnames(['flex', className])} ref={anchorRef}>
                        {needsMoreProtection ? (
                            <SettingsLink
                                path="/email-privacy"
                                app={APPS.PROTONMAIL}
                                className="relative inline-flex mr0-1 item-spy-tracker-link flex-align-items-center"
                            >
                                {icon}
                            </SettingsLink>
                        ) : (
                            <Href
                                url={emailTrackerProtectionURL}
                                className="relative inline-flex mr0-1 item-spy-tracker-link flex-align-items-center"
                            >
                                {icon}
                            </Href>
                        )}
                    </div>
                </Tooltip>
            </div>
        </Spotlight>
    );
};

export default ItemSpyTrackerIcon;
