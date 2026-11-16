import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';

import { IncreaseBlockedReason } from './helpers';

interface IncreaseBlockedTooltipProps {
    increaseBlockedReasons: IncreaseBlockedReason[];
    increaseBlockedReasonText?: string;
    isIncDisabled: boolean;
    children: React.ReactNode;
}

export const IncreaseBlockedTooltip = ({
    increaseBlockedReasons,
    increaseBlockedReasonText,
    isIncDisabled,
    children,
}: IncreaseBlockedTooltipProps) => {
    const [showTooltip, setShowTooltip] = useState<true | undefined>(undefined);

    const increaseBlockedReason = increaseBlockedReasons[0] ?? null;
    const increaseReasonText =
        increaseBlockedReasonText ??
        (increaseBlockedReason === IncreaseBlockedReason.TRIAL_LIMIT
            ? c('b2b_trials_2025_Info').t`You have reached the trial limit.`
            : null);
    const previousIsIncDisabled = useRef(isIncDisabled);

    // Show tooltip when hitting the limit, auto-hide after 3 seconds
    useEffect(() => {
        const becameDisabled = isIncDisabled && !previousIsIncDisabled.current;
        previousIsIncDisabled.current = isIncDisabled;
        // A held Scribe row opens at its cap, so it only pops up when the user reaches the cap
        if (increaseBlockedReason === IncreaseBlockedReason.SCRIBE_RETIRED && !becameDisabled) {
            return;
        }

        setShowTooltip(true);
        const timer = setTimeout(() => setShowTooltip(undefined), 3000);
        return () => clearTimeout(timer);
    }, [increaseBlockedReason, isIncDisabled]);

    // If no tooltip needed, just return children
    if (!increaseBlockedReason || !isIncDisabled) {
        return children;
    }

    return (
        <Tooltip title={increaseReasonText} openDelay={0} isOpen={showTooltip}>
            <span className="inline-block">{children}</span>
        </Tooltip>
    );
};
