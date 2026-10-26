import type { ComponentProps } from 'react';

import { LumoIcon } from '../../components/LumoIcon/LumoIcon';

export const ApiUsageMetricCard = ({
    icon,
    label,
    value,
    hint,
}: {
    icon: ComponentProps<typeof LumoIcon>['name'];
    label: string;
    value: string;
    hint: string;
}) => (
    <div className="api-usage-metric flex flex-nowrap items-start gap-3 p-4 rounded-xl border border-weak">
        <div className="api-usage-metric__icon flex flex-none items-center justify-center rounded-lg">
            <LumoIcon name={icon} size={17} />
        </div>
        <div className="flex flex-column gap-1 min-w-0">
            <span className="text-xs color-weak">{label}</span>
            <strong className="api-usage-metric__value color-norm">{value}</strong>
            <span className="text-xs color-weak">{hint}</span>
        </div>
    </div>
);
