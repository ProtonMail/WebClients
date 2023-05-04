import { useEffect } from 'react';

import { isPast } from 'date-fns';
import { c } from 'ttag';

import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';
import clsx from '@proton/utils/clsx';

interface Props {
    featureKey: string; // Used for localStorage key
    showOnce?: boolean; // Will be hide after the user saw it once
    endDate?: number | Date; // A date/timestamp when the tag should not be shown anymore
    className?: string;
}

// This NewFeatureTag component is meant to be used to show to the user that a new product feature has dropped
const NewFeatureTag = ({ featureKey, showOnce = false, endDate, className }: Props) => {
    const key = `${featureKey}-new-tag`;
    const wasShown = Boolean(getItem(key, 'false'));
    const hasEnded = endDate && isPast(endDate);

    useEffect(() => {
        if (hasEnded) {
            // Cleanup until the NewFeatureTag call is removed from code
            removeItem(key);
        }
        return () => {
            if (!wasShown && showOnce && !hasEnded) {
                setItem(key, 'true');
            }
        };
    }, [hasEnded, wasShown, showOnce, key]);

    if ((showOnce && wasShown) || hasEnded) {
        return null;
    }
    return <span className={clsx('bg-success px-1 py-0.5 rounded text-semibold', className)}>{c('Info').t`New`}</span>;
};

export default NewFeatureTag;
