import * as React from 'react';

import { c, msgid } from 'ttag';

import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

import NumberOfElementsBubble from './NumberOfElementsBubble';

interface Props {
    numberOfTrackers: number;
    needsMoreProtection: boolean;
    title: string;
    className?: string;
    openSpyTrackerModal?: () => void;
    isStandaloneIcon?: boolean;
}

const SpyTrackerIcon = ({
    numberOfTrackers,
    needsMoreProtection,
    title,
    className,
    openSpyTrackerModal,
    isStandaloneIcon = false,
}: Props) => {
    return (
        <div
            className={clsx([
                'relative inline-flex item-spy-tracker-link flex-align-items-center',
                isStandaloneIcon && 'mr-0.5',
                className,
            ])}
        >
            <Icon
                name="shield"
                size={16}
                alt={title}
                data-testid="privacy:tracker-icon"
                className={clsx([
                    needsMoreProtection && numberOfTrackers === 0 ? 'color-weak' : 'color-primary',
                    'relative inline-flex item-spy-tracker-link flex-align-items-center',
                    !isStandaloneIcon && 'cursor-pointer',
                    isStandaloneIcon && 'mr-0.5',
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
