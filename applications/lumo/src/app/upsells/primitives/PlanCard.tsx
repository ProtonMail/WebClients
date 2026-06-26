import type { ReactNode } from 'react';

import { Icon } from '@proton/components';
import type { IconName } from '@proton/icons/types';

export interface PlanFeature {
    icon: IconName;
    getText: () => string;
}

interface PlanCardProps {
    planName: string;
    features: PlanFeature[];
    children: ReactNode;
}

export const PlanCard = ({ planName, features, children }: PlanCardProps) => (
    <div className="flex flex-column gap-4 p-4 rounded-xl border border-weak flex-auto">
        <h3 className="text-lg text-semibold m-0">{planName}</h3>
        <ul className="unstyled m-0 flex flex-column gap-3 flex-auto">
            {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                    <Icon name={feature.icon} size={4} className="shrink-0 color-weak" />
                    <span className="color-weak text-sm">{feature.getText()}</span>
                </li>
            ))}
        </ul>
        <div>{children}</div>
    </div>
);
