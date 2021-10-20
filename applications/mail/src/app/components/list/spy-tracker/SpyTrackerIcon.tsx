import { classnames, Icon } from '@proton/components';
import { c, msgid } from 'ttag';
import * as React from 'react';
import NumberOfElementsBubble from './NumberOfElementsBubble';

interface Props {
    numberOfTrackers: number;
    needsMoreProtection: boolean;
    title: string;
    className?: string;
    openSpyTrackerModal?: () => void;
}

const SpyTrackerIcon = ({ numberOfTrackers, needsMoreProtection, title, className, openSpyTrackerModal }: Props) => {
    return (
        <div
            className={classnames([
                'relative inline-flex mr0-1 item-spy-tracker-link flex-align-items-center',
                className,
            ])}
        >
            <Icon
                name="shield"
                size={16}
                alt={title}
                data-testid="privacy:tracker-icon"
                className={classnames([
                    needsMoreProtection && numberOfTrackers === 0 ? 'color-weak' : 'color-primary',
                    'relative inline-flex mr0-1 item-spy-tracker-link flex-align-items-center cursor-pointer',
                    className,
                ])}
                onClick={openSpyTrackerModal}
            />
            {numberOfTrackers > 0 && (
                <NumberOfElementsBubble
                    numberOfElements={numberOfTrackers}
                    className="absolute"
                    data-testid="privacy:icon-number-of-trackers"
                    aria-label={c('Info').ngettext(
                        msgid`${numberOfTrackers} email tracker blocked`,
                        `${numberOfTrackers} email trackers blocked`,
                        numberOfTrackers
                    )}
                />
            )}
        </div>
    );
};

export default SpyTrackerIcon;
