import React, { useEffect, useState } from 'react';

import { isPast } from 'date-fns';
import { c } from 'ttag';

import { Spotlight, SpotlightProps } from '@proton/components/components';
import { versionCookieAtLoad } from '@proton/components/hooks/useEarlyAccess';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';
import { EnvironmentExtended } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

export type IsActiveInEnvironmentContainer = { [key in EnvironmentExtended]?: boolean };

interface Props {
    /** Used for localStorage key */
    featureKey: string;
    /** Will be hide after the user saw it once */
    showOnce?: boolean;
    /** A date/timestamp when the tag should not be shown anymore */
    endDate?: number | Date;
    /** Css classes to be applied */
    className?: string;
    /** When provided, NewFeatureTag will wrap the tag in a Spotlight and pass this property object to it */
    spotlightProps?: SpotlightProps;
    /**
     * When provided, NewFeatureTag be rendered only in environments listed as true in the container
     * E.g.: { default: true, alpha: ture } will be rendered in default and alpha but not in beta
     * isActiveInEnvironment === undefined will render NewFeatureTag in all environments
     */
    isActiveInEnvironment?: IsActiveInEnvironmentContainer;
}

// This NewFeatureTag component is meant to be used to show to the user that a new product feature has dropped
const NewFeatureTag = ({
    featureKey,
    showOnce = false,
    endDate,
    className,
    spotlightProps,
    isActiveInEnvironment,
}: Props) => {
    const key = `${featureKey}-new-tag`;
    const [wasShown] = useState<boolean>(Boolean(getItem(key, 'false')));
    const hasEnded = endDate && isPast(endDate);
    const displaySpotlight = !!spotlightProps;

    useEffect(() => {
        if (hasEnded) {
            // Cleanup until the NewFeatureTag call is removed from code
            removeItem(key);
        } else if (showOnce) {
            setItem(key, 'true');
        }
    }, [hasEnded, showOnce, key]);

    if (!!isActiveInEnvironment && !isActiveInEnvironment[versionCookieAtLoad ?? 'default']) {
        return null;
    }

    if ((showOnce && wasShown) || hasEnded) {
        return null;
    }

    const content = (
        <span className={clsx('bg-success px-1 py-0.5 rounded text-semibold', className)}>{c('Info').t`New`}</span>
    );
    if (displaySpotlight) {
        return <Spotlight {...spotlightProps}>{content}</Spotlight>;
    }
    return content;
};

export default NewFeatureTag;
