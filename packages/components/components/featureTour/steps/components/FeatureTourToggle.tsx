import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { c } from 'ttag';

import Label from '@proton/components/components/label/Label';
import Toggle from '@proton/components/components/toggle/Toggle';
import generateUID from '@proton/utils/generateUID';

/**
 * Allow to toggle a feature on/off
 * Displays "active" instead of toggle if feature is enabled
 */
const FeatureTourToggle = ({
    checked,
    isFeatureEnabled,
    onToggle,
    title,
}: {
    checked: boolean;
    isFeatureEnabled: boolean;
    onToggle: () => void;
    title: ReactNode;
}) => {
    const id = useMemo(() => generateUID('feature-tour-toggle'), []);

    return (
        <div
            className="flex justify-space-between flex-nowrap text-left border border-weak rounded items-center h-custom"
            style={{ '--h-custom': '3.75rem' }}
        >
            <Label className="color-norm pt-0 ml-4 flex-auto" htmlFor={id}>
                {title}
            </Label>
            <div className="mr-4">
                {isFeatureEnabled ? (
                    <div className="rounded-sm bg-success px-1.5 py-0.5 text-sm text-uppercase text-bold">{c('Info')
                        .t`Active`}</div>
                ) : (
                    <Toggle id={id} checked={checked} onClick={onToggle} className="block" />
                )}
            </div>
        </div>
    );
};

export default FeatureTourToggle;
