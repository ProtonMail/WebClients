import type { ReactNode } from 'react';

import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';

/**
 * Allow to toggle a feature on/off
 * Displays "active" instead of toggle if feature is enabled
 */
const FeatureTourToggle = ({
    isFeatureEnabled,
    checked,
    loading,
    onToggle,
    title,
}: {
    title: ReactNode;
    isFeatureEnabled: boolean;
    checked: boolean;
    loading?: boolean;
    onToggle: () => void;
}) => {
    return (
        <div className="border border-weak rounded p-4 flex justify-space-between flex-nowrap items-center mb-8">
            <div className="color-weak">{title}</div>
            {isFeatureEnabled ? (
                <div className="rounded-sm color-white bg-success px-1.5 py-0.5 text-sm text-uppercase text-bold">{c(
                    'Info'
                ).t`Active`}</div>
            ) : (
                <Toggle checked={checked} loading={loading} onClick={onToggle} />
            )}
        </div>
    );
};

export default FeatureTourToggle;
