import type { ComponentProps, ReactNode } from 'react';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';

export const ApiUsageMetricCard = ({
    icon,
    label,
    value,
    hint,
    breakdown,
}: {
    icon: ComponentProps<typeof LumoIcon>['name'];
    label: string;
    value: string;
    hint: string;
    breakdown?: ReactNode;
}) => (
    <div className="api-usage-metric flex flex-nowrap items-start gap-3 p-4 border lumo-border radius-16">
        <div className="api-usage-metric__icon flex flex-none items-center justify-center radius-12 lumo-color-glyph-brand-text lumo-bg-control-fill">
            <LumoIcon name={icon} size={17} />
        </div>
        <div className="flex flex-column gap-1 min-w-0">
            <span className="lumo-label-small lumo-color-glyph-mid">{label}</span>
            <strong className="api-usage-metric__value lumo-title-large lumo-color-glyph">{value}</strong>
            <span className="lumo-body-small lumo-color-glyph-mid">{hint}</span>
            {breakdown}
        </div>
    </div>
);
