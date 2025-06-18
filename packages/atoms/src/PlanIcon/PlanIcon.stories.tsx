import type { Meta, StoryObj } from '@storybook/react';

import { PLANS, PLAN_NAMES } from '@proton/payments';
import { APPS, APPS_CONFIGURATION } from '@proton/shared/lib/constants';

import { PlanIcon } from '..';

const meta: Meta<typeof PlanIcon> = {
    component: PlanIcon,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof PlanIcon>;

const allPlans = Object.values(PLANS);

const freeApps = [APPS.PROTONMAIL, APPS.PROTONDRIVE, APPS.PROTONVPN_SETTINGS, APPS.PROTONPASS, APPS.PROTONWALLET];

export const AllPlans: Story = {
    render: () => (
        <div className="grid grid-cols-4 gap-4">
            {allPlans.map((plan) => (
                <div key={plan} className="flex flex-col items-center gap-2">
                    <PlanIcon planName={plan} />
                    <span className="text-sm text-weak">{PLAN_NAMES[plan]}</span>
                </div>
            ))}
        </div>
    ),
};

export const FreePlanVariants: Story = {
    render: () => (
        <div className="grid grid-cols-4 gap-4">
            {freeApps.map((app) => (
                <div key={app} className="flex flex-col items-center gap-2">
                    <PlanIcon planName={PLANS.FREE} app={app} />
                    <span className="text-sm text-weak">Free - {APPS_CONFIGURATION[app]?.name}</span>
                </div>
            ))}
        </div>
    ),
};
