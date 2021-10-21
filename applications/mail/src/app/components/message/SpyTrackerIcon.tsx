import { classnames, Href, Icon, SettingsLink } from '@proton/components';
import { c, msgid } from 'ttag';
import { APPS } from '@proton/shared/lib/constants';
import * as React from 'react';
import { emailTrackerProtectionURL } from '../../constants';

interface Props {
    numberOfTrackers: number;
    needsMoreProtection: boolean;
    title: string;
    className?: string;
}

const SpyTrackerIcon = ({ numberOfTrackers, needsMoreProtection, title, className }: Props) => {
    const icon = (
        <>
            <Icon
                name="shield"
                size={16}
                alt={title}
                data-testid="privacy:tracker-icon"
                className={classnames([needsMoreProtection && numberOfTrackers === 0 ? 'color-weak' : 'color-primary'])}
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
        <>
            {needsMoreProtection ? (
                <SettingsLink
                    path="/email-privacy"
                    app={APPS.PROTONMAIL}
                    className={classnames([
                        'relative inline-flex mr0-1 item-spy-tracker-link flex-align-items-center',
                        className,
                    ])}
                >
                    {icon}
                </SettingsLink>
            ) : (
                <Href
                    url={emailTrackerProtectionURL}
                    className={classnames([
                        'relative inline-flex mr0-1 item-spy-tracker-link flex-align-items-center',
                        className,
                    ])}
                >
                    {icon}
                </Href>
            )}
        </>
    );
};

export default SpyTrackerIcon;
