import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms';

import type { IncreaseBlockedReason } from './ButtonNumberInput';

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
        increaseBlockedReason === 'trial-limit'
            ? (increaseBlockedReasonText ?? c('b2b_trials_2025_Info').t`You have reached the trial limit.`)
            : null;

    // Show tooltip when hitting the limit, auto-hide after 3 seconds
    useEffect(() => {
        if (increaseBlockedReason && isIncDisabled) {
            setShowTooltip(true);
            const timer = setTimeout(() => setShowTooltip(undefined), 3000);
            return () => clearTimeout(timer);
        }
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
