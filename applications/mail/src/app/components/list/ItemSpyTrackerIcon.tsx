import { c } from 'ttag';
import { classnames, Href, Icon, SettingsLink, Tooltip, useMailSettings } from '@proton/components';

import { APPS, IMAGE_PROXY_FLAGS, SHOW_IMAGES } from '@proton/shared/lib/constants';
import * as React from 'react';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { WELCOME_PANE_OPTIONS_URLS } from '../../constants';
import { MessageExtended } from '../../models/message';

interface Props {
    message?: MessageExtended;
    className?: string;
}

const ItemSpyTrackerIcon = ({ message, className }: Props) => {
    const [mailSettings] = useMailSettings();

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

    /*
     * Don't display the tracker icon when :
     * Loading remote images is automatic and email protection is OFF : We consider that the user don't want any protection at all.
     * But the user might have set recently the protection to OFF, so if we find trackers in previous emails, we still display the icon.
     */
    if (!hasProtection && hasShowImage && numberOfTrackers === 0) {
        return null;
    }

    const getTitle = () => {
        if (!hasProtection && !hasShowImage) {
            return c('Info').t`Protect yourself from trackers by turning on Proton email tracker protection.`;
        }
        if (hasProtection && numberOfTrackers === 0) {
            return c('Info').t`No email trackers found.`;
        }

        return c('Info').t`Proton has blocked email trackers in this message in order to protect your privacy.`;
    };

    const icon = (
        <>
            <Icon name="shield" size={14} alt={getTitle()} data-testid="privacy:tracker-icon" />
            {numberOfTrackers > 0 ? (
                <span
                    data-testid="privacy:icon-number-of-trackers"
                    style={{
                        backgroundColor: 'green',
                        left: '6px',
                        top: '-4px',
                        height: '1rem',
                        width: '1rem',
                        fontSize: '11px',
                        position: 'absolute',
                        textAlign: 'center',
                        borderRadius: '50%',
                        color: 'white',
                    }}
                >
                    {numberOfTrackers}
                </span>
            ) : null}
        </>
    );

    return (
        <Tooltip title={getTitle()} data-testid="privacy:icon-tooltip">
            <div className={classnames(['flex', className])}>
                {!hasProtection && !hasShowImage ? (
                    <SettingsLink path="/email-privacy" app={APPS.PROTONMAIL} className="relative block">
                        {icon}
                    </SettingsLink>
                ) : (
                    <Href url={WELCOME_PANE_OPTIONS_URLS.proton2FA} className="relative block">
                        {icon}
                    </Href>
                )}
            </div>
        </Tooltip>
    );
};

export default ItemSpyTrackerIcon;
