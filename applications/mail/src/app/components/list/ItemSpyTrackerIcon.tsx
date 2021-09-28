import { useRef } from 'react';
import { c, msgid } from 'ttag';
import {
    classnames,
    FeatureCode,
    Href,
    Icon,
    SettingsLink,
    Spotlight,
    Tooltip,
    useMailSettings,
    useSpotlightOnFeature,
} from '@proton/components';

import { APPS, IMAGE_PROXY_FLAGS, SHOW_IMAGES } from '@proton/shared/lib/constants';
import * as React from 'react';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { emailTrackerProtectionURL } from '../../constants';
import { MessageExtended } from '../../models/message';

import './ItemSpyTrackerIcon.scss';

interface Props {
    message?: MessageExtended;
    className?: string;
}

const ItemSpyTrackerIcon = ({ message, className }: Props) => {
    const [mailSettings] = useMailSettings();
    const anchorRef = useRef(null);

    const getNumberOfTrackers = () => {
        return (
            message?.messageImages?.images.filter((image) => {
                return image.tracker !== undefined;
            }).length || 0
        );
    };

    const hasProtection = (mailSettings?.ImageProxy ? mailSettings.ImageProxy : 0) > IMAGE_PROXY_FLAGS.NONE;
    const hasShowImage = hasBit(mailSettings?.ShowImages ? mailSettings.ShowImages : 0, SHOW_IMAGES.REMOTE);
    const numberOfTrackers = getNumberOfTrackers();

    // Display the spotlight only once, if trackers have been found inside the email
    const { show: showSpotlight, onDisplayed } = useSpotlightOnFeature(
        FeatureCode.SpotlightSpyTrackerProtection,
        numberOfTrackers > 0
    );

    /*
     * If email protection is OFF and we do not load the image automatically, the user is aware about the need of protection.
     * From our side, we want to inform him that he can also turn on protection mode in the settings.
     */
    const needsMoreProtection = !hasProtection && !hasShowImage;

    /*
     * Don't display the tracker icon when :
     * Loading remote images is automatic and email protection is OFF : We consider that the user don't want any protection at all.
     * But the user might have set recently the protection to OFF, so if we find trackers in previous emails, we still display the icon.
     */
    if (!hasProtection && hasShowImage && numberOfTrackers === 0) {
        return null;
    }

    const getTitle = () => {
        if (needsMoreProtection) {
            return c('Info').t`Protect yourself from trackers by turning on Proton email tracker protection.`;
        }
        if (hasProtection && numberOfTrackers === 0) {
            return c('Info').t`No email trackers found.`;
        }

        return c('Info').t`Proton has blocked email trackers in this message in order to protect your privacy.`;
    };

    const icon = (
        <>
            <Icon
                name="shield"
                size={14}
                alt={getTitle()}
                data-testid="privacy:tracker-icon"
                className={classnames([needsMoreProtection && numberOfTrackers === 0 && 'color-weak'])}
            />
            {numberOfTrackers > 0 ? (
                <span
                    className={classnames([
                        'item-spy-tracker-icon-bubble bg-primary rounded50 absolute text-center text-sm m0 lh130',
                        numberOfTrackers > 9 && 'item-spy-tracker-icon-bubble--9plus',
                    ])}
                    data-testid="privacy:icon-number-of-trackers"
                    aria-label={c('Info').ngettext(
                        msgid`${numberOfTrackers} email tracker blocked`,
                        `${numberOfTrackers} email trackers blocked`,
                        numberOfTrackers
                    )}
                >
                    {numberOfTrackers > 9 ? '9+' : numberOfTrackers}
                </span>
            ) : null}
        </>
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
        </Spotlight>
    );
};

export default ItemSpyTrackerIcon;
