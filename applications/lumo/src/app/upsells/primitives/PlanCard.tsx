import type { ReactNode } from 'react';
import React from 'react';

import { Card } from '@proton/atoms/Card/Card';

import { type IconName, LumoIcon } from '../../components/LumoIcon/LumoIcon.tsx';

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
    <Card
        padded={false}
        background={false}
        className="flex flex-column flex-nowrap flex-1 gap-3 min-w-0 p-5 lumo-border radius-16 lumo-bg-panel-elevated"
    >
        <h3 className="m-0 lumo-title-medium lumo-color-glyph">{planName}</h3>
        <ul className="unstyled m-0 flex flex-column flex-nowrap flex-auto gap-2.5">
            {features.map((feature, index) => (
                <li key={index} className="flex flex-nowrap items-center gap-2.5">
                    <LumoIcon name={feature.icon} size={16} className="shrink-0 lumo-color-glyph" />
                    <span className="lumo-body-medium lumo-color-glyph">{feature.getText()}</span>
                </li>
            ))}
        </ul>
        <div>{children}</div>
    </Card>
);
